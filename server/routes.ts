import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerSchema, loginSchema, insertChallengeSchema, insertMessageSchema, insertCommunitySchema, insertCheckInSchema, DEPOSIT_MINIMUM, WITHDRAW_MINIMUM, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { walletService } from "./services/wallet-service";
import { transactionService } from "./services/transaction-service";
import { paymentService } from "./services/payment-service";
import { webhookService } from "./services/webhook-service";
import { challengeFinanceService } from "./services/challenge-finance-service";
import { db } from "./db";
import { challenges, communities, transactions, challengeJoinRequests, followRequests, users, messages, checkIns, challengeParticipants } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

async function reverseGeocode(lat: string | null, lng: string | null): Promise<string> {
  if (!lat || !lng) return "";
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { "User-Agent": "VYTAL-App/1.0" },
    });
    if (!res.ok) return "";
    const data = await res.json();
    const addr = data.address;
    if (!addr) return data.display_name || "";
    const parts = [addr.road, addr.suburb, addr.city || addr.town || addr.village].filter(Boolean);
    return parts.join(", ") || data.display_name || "";
  } catch {
    return "";
  }
}

function haversineDistanceServer(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import * as oidcClient from "openid-client";
import memoize from "memoizee";
import { OAuth2Client } from "google-auth-library";
import { pushService } from "./services/push-service";
import { notificationService } from "./services/notification-service";

const resetCodes = new Map<string, { code: string; expiresAt: number }>();

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpiredCodes() {
  const now = Date.now();
  for (const [key, val] of resetCodes) {
    if (val.expiresAt < now) resetCodes.delete(key);
  }
}

const resetEmailHtml = (code: string) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#1a7a3a;font-size:28px;margin:0;">VYTAL</h1>
    <p style="color:#6b7280;font-size:14px;margin-top:4px;">Recuperação de senha</p>
  </div>
  <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <p style="color:#374151;font-size:14px;margin:0 0 16px;">Seu código de verificação é:</p>
    <div style="text-align:center;background:#f0fdf4;border:2px dashed #22c55e;border-radius:12px;padding:20px;margin-bottom:16px;">
      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1a7a3a;">${code}</span>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Este código expira em <strong>15 minutos</strong>.</p>
  </div>
  <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">Se você não solicitou esta recuperação, ignore este e-mail.</p>
</div>`;

async function sendResetEmail(email: string, code: string): Promise<boolean> {
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || "oliveirasocial74@gmail.com";
      const senderName = process.env.BREVO_SENDER_NAME || "VYTAL";
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email }],
          subject: "Código de recuperação de senha - VYTAL",
          htmlContent: resetEmailHtml(code),
        }),
      });
      if (res.ok) return true;
      const err = await res.text();
      console.error("Brevo error:", res.status, err);
      return false;
    } catch (err) {
      console.error("Brevo send error:", err);
      return false;
    }
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpUser && smtpPass) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from: `"VYTAL" <${smtpUser}>`,
        to: email,
        subject: "Código de recuperação de senha - VYTAL",
        html: resetEmailHtml(code),
      });
      return true;
    } catch (err) {
      console.error("SMTP send error:", err);
      return false;
    }
  }

  console.error("No email provider configured (set BREVO_API_KEY or SMTP_USER+SMTP_PASS)");
  return false;
}

const ADMIN_EMAILS = [
  "oliveirasocial74@gmail.com",
  "quinzinhooliveiraa@gmail.com",
];

async function notifyAdminsNewUser(userName: string, userEmail: string, provider: string) {
  try {
    const adminIds = await storage.getAdminUserIds();
    for (const adminId of adminIds) {
      notificationService.notify(adminId, {
        type: "new_user",
        title: "Novo usuário cadastrado",
        body: `${userName} (${userEmail}) se cadastrou via ${provider}.`,
        actionUrl: "/admin",
      }).catch(() => {});
    }
  } catch {}
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const PgStore = pgSession(session);

  app.use(session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "fitstake-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  }));

  // Auth middleware
  const lastActivityUpdate = new Map<string, number>();

  function requireAuth(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const userId = req.session.userId;
    const now = Date.now();
    const last = lastActivityUpdate.get(userId) || 0;
    if (now - last > 5 * 60 * 1000) {
      lastActivityUpdate.set(userId, now);
      storage.updateUser(userId, { lastActiveAt: new Date() } as any).catch(() => {});
    }
    next();
  }

  // ====== AUTH ======

  const providerLabel: Record<string, string> = {
    email: "e-mail e senha",
    google: "Google",
    apple: "Apple",
    replit: "Replit",
  };

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        const usedProvider = (existingEmail as any).authProvider || "email";
        const label = providerLabel[usedProvider] || usedProvider;
        return res.status(400).json({ message: `Este e-mail já está cadastrado via ${label}. Faça login usando ${label}.` });
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) return res.status(400).json({ message: "Username já em uso" });

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const isAdmin = ADMIN_EMAILS.includes(data.email.toLowerCase());
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        isAdmin,
        authProvider: "email",
      } as any);

      notifyAdminsNewUser(data.name || data.username, data.email, "e-mail");
      (req.session as any).userId = user.id;
      const { password, twoFactorSecret, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar conta" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      if (!user) return res.status(401).json({ message: "Email ou senha inválidos" });

      const userProvider = (user as any).authProvider || "email";
      if (userProvider !== "email") {
        const label = providerLabel[userProvider] || userProvider;
        return res.status(400).json({ message: `Esta conta foi criada via ${label}. Faça login usando ${label}.` });
      }

      const valid = await bcrypt.compare(data.password, user.password);
      if (!valid) return res.status(401).json({ message: "Email ou senha inválidos" });

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        const { token } = req.body;
        if (!token) {
          return res.status(200).json({ requires2FA: true, userId: user.id });
        }
        const { TOTP } = await import("otpauth");
        const totp = new TOTP({ issuer: "VYTAL", label: user.email, secret: user.twoFactorSecret, algorithm: "SHA1", digits: 6, period: 30 });
        const valid2FA = totp.validate({ token, window: 1 }) !== null;
        if (!valid2FA) return res.status(401).json({ message: "Código 2FA inválido" });
      }

      (req.session as any).userId = user.id;
      await storage.updateUser(user.id, { online: true });
      const { password, twoFactorSecret, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/verify-2fa", async (req, res) => {
    try {
      const { userId, token } = req.body;
      if (!userId || !token) return res.status(400).json({ message: "Dados incompletos" });
      const user = await storage.getUser(userId);
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return res.status(400).json({ message: "2FA não configurado" });
      }
      const { TOTP } = await import("otpauth");
      const totp = new TOTP({ issuer: "VYTAL", label: user.email, secret: user.twoFactorSecret, algorithm: "SHA1", digits: 6, period: 30 });
      const valid = totp.validate({ token, window: 1 }) !== null;
      if (!valid) return res.status(401).json({ message: "Código 2FA inválido" });

      (req.session as any).userId = user.id;
      await storage.updateUser(user.id, { online: true });
      const { password, twoFactorSecret, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro na verificação 2FA" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    if (userId) await storage.updateUser(userId, { online: false });
    req.session.destroy(() => {
      res.json({ message: "Logout realizado" });
    });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "E-mail é obrigatório" });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "Se o e-mail estiver cadastrado, enviaremos um código de recuperação." });
      }

      const userProvider = (user as any).authProvider || "email";
      if (userProvider !== "email") {
        const label = providerLabel[userProvider] || userProvider;
        return res.status(400).json({ message: `Esta conta foi criada via ${label}. Não é possível redefinir a senha — faça login usando ${label}.` });
      }

      cleanExpiredCodes();
      const code = generateResetCode();
      resetCodes.set(email.toLowerCase(), { code, expiresAt: Date.now() + 15 * 60 * 1000 });

      const sent = await sendResetEmail(email, code);
      if (!sent) {
        return res.status(500).json({ message: "Erro ao enviar e-mail. Tente novamente." });
      }

      res.json({ message: "Se o e-mail estiver cadastrado, enviaremos um código de recuperação." });
    } catch (error: any) {
      res.status(500).json({ message: "Erro interno. Tente novamente." });
    }
  });

  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ message: "Dados incompletos" });

      const stored = resetCodes.get(email.toLowerCase());
      if (!stored || stored.expiresAt < Date.now()) {
        return res.status(400).json({ message: "Código expirado ou inválido. Solicite um novo." });
      }
      if (stored.code !== code) {
        return res.status(400).json({ message: "Código incorreto." });
      }

      res.json({ valid: true });
    } catch (error: any) {
      res.status(500).json({ message: "Erro interno." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) return res.status(400).json({ message: "Dados incompletos" });
      if (newPassword.length < 6) return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });

      const stored = resetCodes.get(email.toLowerCase());
      if (!stored || stored.expiresAt < Date.now()) {
        return res.status(400).json({ message: "Código expirado. Solicite um novo." });
      }
      if (stored.code !== code) {
        return res.status(400).json({ message: "Código incorreto." });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(400).json({ message: "Usuário não encontrado." });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword } as any);
      resetCodes.delete(email.toLowerCase());

      res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao redefinir senha." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Não autenticado" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Usuário não encontrado" });
    const { password, twoFactorSecret, ...safeUser } = user;
    res.json(safeUser);
  });

  // ====== SOCIAL LOGIN (Google / Apple via Replit OIDC) ======

  const getOidcConfig = memoize(
    async () => {
      return await oidcClient.discovery(
        new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
        process.env.REPL_ID!
      );
    },
    { maxAge: 3600 * 1000 }
  );

  app.get("/api/login", async (req, res) => {
    try {
      const config = await getOidcConfig();
      const callbackUrl = `https://${req.hostname}/api/callback`;
      const codeVerifier = oidcClient.randomPKCECodeVerifier();
      const codeChallenge = await oidcClient.calculatePKCECodeChallenge(codeVerifier);
      const state = oidcClient.randomState();

      (req.session as any).oidc = { codeVerifier, state, callbackUrl };

      const authUrl = oidcClient.buildAuthorizationUrl(config, {
        redirect_uri: callbackUrl,
        scope: "openid email profile",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
        prompt: "login consent",
      });

      res.redirect(authUrl.href);
    } catch (error: any) {
      console.error("OIDC login error:", error);
      res.redirect("/login?error=social_login_failed");
    }
  });

  app.get("/api/callback", async (req, res) => {
    try {
      const config = await getOidcConfig();
      const oidcSession = (req.session as any).oidc;
      if (!oidcSession) return res.redirect("/login?error=session_expired");

      const tokens = await oidcClient.authorizationCodeGrant(config, new URL(req.url, `https://${req.hostname}`), {
        pkceCodeVerifier: oidcSession.codeVerifier,
        expectedState: oidcSession.state,
      });

      const claims = tokens.claims();
      if (!claims) return res.redirect("/login?error=no_claims");

      const email = claims.email as string;
      const firstName = (claims as any).first_name || claims.given_name || "";
      const lastName = (claims as any).last_name || claims.family_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || email.split("@")[0];
      const profileImage = (claims as any).profile_image_url || claims.picture || "";

      delete (req.session as any).oidc;

      let appUser = await storage.getUserByEmail(email);

      if (appUser) {
        const existingProvider = (appUser as any).authProvider || "email";
        if (existingProvider !== "replit") {
          const label = providerLabel[existingProvider] || existingProvider;
          return res.redirect(`/login?error=email_exists&provider=${encodeURIComponent(label)}`);
        }
        (req.session as any).userId = appUser.id;
        await storage.updateUser(appUser.id, { online: true, avatar: appUser.avatar || profileImage });
      } else {
        const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20);
        let username = baseUsername;
        let counter = 1;
        while (await storage.getUserByUsername(username)) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(2) + Date.now(), 10);
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

        appUser = await storage.createUser({
          username,
          email,
          password: randomPassword,
          name: fullName,
          avatar: profileImage,
          isAdmin,
          authProvider: "replit",
        } as any);

        notifyAdminsNewUser(fullName, email, "Replit");
        (req.session as any).userId = appUser.id;
        res.redirect("/onboarding");
        return;
      }

      res.redirect("/dashboard");
    } catch (error: any) {
      console.error("OIDC callback error:", error);
      res.redirect("/login?error=auth_failed");
    }
  });

  // ====== GOOGLE DIRECT LOGIN ======

  const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) return res.status(400).json({ message: "Token não fornecido" });

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) return res.status(400).json({ message: "Token inválido" });

      const email = payload.email;
      const fullName = payload.name || email.split("@")[0];
      const profileImage = payload.picture || "";

      let appUser = await storage.getUserByEmail(email);

      if (appUser) {
        const existingProvider = (appUser as any).authProvider || "email";
        if (existingProvider !== "google") {
          const label = providerLabel[existingProvider] || existingProvider;
          return res.status(400).json({ message: `Este e-mail já está cadastrado via ${label}. Faça login usando ${label}.` });
        }
        (req.session as any).userId = appUser.id;
        await storage.updateUser(appUser.id, { online: true, avatar: appUser.avatar || profileImage });
        res.json({ user: appUser, isNew: false });
      } else {
        const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20);
        let username = baseUsername;
        let counter = 1;
        while (await storage.getUserByUsername(username)) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(2) + Date.now(), 10);
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

        appUser = await storage.createUser({
          username,
          email,
          password: randomPassword,
          name: fullName,
          avatar: profileImage,
          isAdmin,
          authProvider: "google",
        } as any);

        notifyAdminsNewUser(fullName, email, "Google");
        (req.session as any).userId = appUser.id;
        res.json({ user: appUser, isNew: true });
      }
    } catch (error: any) {
      console.error("Google auth error:", error);
      res.status(400).json({ message: "Erro na autenticação com Google" });
    }
  });

  // ====== APPLE DIRECT LOGIN ======

  app.post("/api/auth/apple", async (req, res) => {
    try {
      const { identityToken, user: appleUser, fullName } = req.body;
      if (!identityToken) {
        return res.status(400).json({ message: "Token da Apple não fornecido" });
      }

      const parts = identityToken.split(".");
      if (parts.length !== 3) {
        return res.status(400).json({ message: "Token inválido" });
      }
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

      if (!payload.sub) {
        return res.status(400).json({ message: "Token da Apple inválido" });
      }

      const appleId = payload.sub;
      const email = payload.email || (appleUser ? `${appleUser}@privaterelay.appleid.com` : `${appleId}@privaterelay.appleid.com`);
      const fullNameStr = fullName?.givenName
        ? `${fullName.givenName}${fullName.familyName ? ` ${fullName.familyName}` : ""}`
        : email.split("@")[0];

      let appUser = await storage.getUserByEmail(email);

      if (appUser) {
        const existingProvider = (appUser as any).authProvider || "email";
        if (existingProvider !== "apple") {
          const label = providerLabel[existingProvider] || existingProvider;
          return res.status(400).json({ message: `Este e-mail já está cadastrado via ${label}. Faça login usando ${label}.` });
        }
        (req.session as any).userId = appUser.id;
        await storage.updateUser(appUser.id, { online: true });
        res.json({ user: appUser, isNew: false });
      } else {
        const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20);
        let username = baseUsername;
        let counter = 1;
        while (await storage.getUserByUsername(username)) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(2) + Date.now(), 10);
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

        appUser = await storage.createUser({
          username,
          email,
          password: randomPassword,
          name: fullNameStr,
          avatar: "",
          isAdmin,
          authProvider: "apple",
        } as any);

        notifyAdminsNewUser(fullNameStr, email, "Apple");
        (req.session as any).userId = appUser.id;
        res.json({ user: appUser, isNew: true });
      }
    } catch (error: any) {
      console.error("Apple auth error:", error);
      res.status(400).json({ message: "Erro na autenticação com Apple" });
    }
  });

  // ====== USERS ======

  app.get("/api/users/search", requireAuth, async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.json([]);
    const results = await storage.searchUsers(query);
    res.json(results.map(({ password, twoFactorSecret, ...u }) => u));
  });

  app.get("/api/users/:username", async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    const { password, twoFactorSecret, ...safeUser } = user;

    const userId = (req.session as any)?.userId;
    const isOwn = userId === user.id;
    let isFollowing = false;
    if (userId) {
      isFollowing = await storage.isFollowing(userId, user.id);
    }

    if (user.isPrivate && !isFollowing && !isOwn) {
      return res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        banner: user.banner,
        isPrivate: true,
        isFollowing: false,
        createdAt: user.createdAt,
        stats: { challengesCompleted: 0, challengesWon: 0, totalEarned: 0, checkInCount: 0 },
        followerCount: 0,
        followingCount: 0,
      });
    }

    const stats = await storage.getUserStats(user.id);
    const followers = await storage.getFollowers(user.id);
    const following = await storage.getFollowing(user.id);

    res.json({
      ...safeUser,
      isFollowing,
      stats,
      followerCount: followers.length,
      followingCount: following.length,
    });
  });

  app.get("/api/users/:username/followers", async (req, res) => {
    const target = await storage.getUserByUsername(req.params.username);
    if (!target) return res.json([]);

    const userId = (req.session as any)?.userId;
    const isOwn = userId === target.id;
    if (target.isPrivate && !isOwn) {
      let isFollowing = false;
      if (userId) isFollowing = await storage.isFollowing(userId, target.id);
      if (!isFollowing) return res.json([]);
    }

    const followers = await storage.getFollowers(target.id);
    res.json(followers.map(f => ({ id: f.follower.id, name: f.follower.name, username: f.follower.username, avatar: f.follower.avatar })));
  });

  app.get("/api/users/:username/following", async (req, res) => {
    const target = await storage.getUserByUsername(req.params.username);
    if (!target) return res.json([]);

    const userId = (req.session as any)?.userId;
    const isOwn = userId === target.id;
    if (target.isPrivate && !isOwn) {
      let isFollowing = false;
      if (userId) isFollowing = await storage.isFollowing(userId, target.id);
      if (!isFollowing) return res.json([]);
    }

    const following = await storage.getFollowing(target.id);
    res.json(following.map(f => ({ id: f.following.id, name: f.following.name, username: f.following.username, avatar: f.following.avatar })));
  });

  app.patch("/api/users/me", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const { name, bio, avatar, goals, publicEarnings, isPrivate, cpf, phone } = req.body;
    const updated = await storage.updateUser(userId, { name, bio, avatar, goals, publicEarnings, isPrivate, cpf, phone });
    if (!updated) return res.status(404).json({ message: "Usuário não encontrado" });
    const { password, twoFactorSecret, ...safeUser } = updated;
    res.json(safeUser);
  });

  app.post("/api/users/pwa-installed", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      await storage.updateUser(userId, { pwaInstalled: true } as any);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/2fa/setup", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

      const { TOTP, Secret } = await import("otpauth");
      const secret = new Secret({ size: 20 });
      const totp = new TOTP({ issuer: "VYTAL", label: user.email, secret, algorithm: "SHA1", digits: 6, period: 30 });
      const otpauthUrl = totp.toString();

      const QRCode = await import("qrcode");
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

      await storage.updateUser(userId, { twoFactorSecret: secret.base32 });

      res.json({ qrCode: qrDataUrl, secret: secret.base32, otpauthUrl });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao configurar 2FA" });
    }
  });

  app.post("/api/auth/2fa/verify", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "Código obrigatório" });

      const user = await storage.getUser(userId);
      if (!user || !user.twoFactorSecret) return res.status(400).json({ message: "2FA não configurado" });

      const { TOTP } = await import("otpauth");
      const totp = new TOTP({ issuer: "VYTAL", label: user.email, secret: user.twoFactorSecret, algorithm: "SHA1", digits: 6, period: 30 });
      const valid = totp.validate({ token, window: 1 }) !== null;
      if (!valid) return res.status(401).json({ message: "Código inválido. Tente novamente." });

      await storage.updateUser(userId, { twoFactorEnabled: true });
      res.json({ message: "2FA ativado com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao verificar 2FA" });
    }
  });

  app.post("/api/auth/2fa/disable", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "Código obrigatório" });

      const user = await storage.getUser(userId);
      if (!user || !user.twoFactorSecret) return res.status(400).json({ message: "2FA não está ativo" });

      const { TOTP } = await import("otpauth");
      const totp = new TOTP({ issuer: "VYTAL", label: user.email, secret: user.twoFactorSecret, algorithm: "SHA1", digits: 6, period: 30 });
      const valid = totp.validate({ token, window: 1 }) !== null;
      if (!valid) return res.status(401).json({ message: "Código inválido" });

      await storage.updateUser(userId, { twoFactorEnabled: false, twoFactorSecret: null });
      res.json({ message: "2FA desativado" });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao desativar 2FA" });
    }
  });

  // ====== CHALLENGES ======

  app.get("/api/challenges", async (req, res) => {
    const challenges = await storage.getChallenges();
    res.json(challenges);
  });

  app.get("/api/challenges/explore", async (req, res) => {
    const allChallenges = await storage.getExploreChallenges();
    const userId = (req.session as any)?.userId;
    let userGoals: string[] = [];
    if (userId) {
      const user = await storage.getUser(userId);
      if (user?.goals && Array.isArray(user.goals)) {
        userGoals = (user.goals as string[]).map(g => g.toLowerCase());
      }
    }

    const withDetails = await Promise.all(allChallenges.map(async (c) => {
      const creator = await storage.getUser(c.createdBy);
      const participants = await storage.getChallengeParticipants(c.id);
      const activeCount = participants.filter((p: any) => p.isActive !== false).length;
      const joinRequests = await db.select().from(challengeJoinRequests)
        .where(eq(challengeJoinRequests.challengeId, c.id));
      const recentRequests = joinRequests.filter(r => {
        const dayAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return r.createdAt && new Date(r.createdAt) > dayAgo;
      }).length;
      const matchesGoal = userGoals.length > 0 && c.sport
        ? userGoals.some(g => c.sport.toLowerCase().includes(g) || g.includes(c.sport.toLowerCase()))
        : false;
      return {
        ...c,
        participantCount: participants.length,
        activeParticipantCount: activeCount,
        joinRequestCount: joinRequests.length,
        recentRequestCount: recentRequests,
        matchesGoal,
        creator: creator ? { id: creator.id, name: creator.name, username: creator.username, avatar: creator.avatar } : null,
      };
    }));
    res.json(withDetails);
  });

  app.get("/api/challenges/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const challenges = await storage.getUserChallenges(userId);
    res.json(challenges);
  });

  app.get("/api/challenges/:id", async (req, res) => {
    const challenge = await storage.getChallenge(req.params.id);
    if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
    
    const participants = await storage.getChallengeParticipants(req.params.id);
    const userId = (req.session as any)?.userId;
    const isParticipant = userId ? participants.some(p => p.userId === userId) : false;
    const isCreator = userId === challenge.createdBy;

    let joinRequestStatus: string | null = null;
    if (userId && !isParticipant) {
      const [existing] = await db.select().from(challengeJoinRequests)
        .where(and(eq(challengeJoinRequests.challengeId, req.params.id), eq(challengeJoinRequests.userId, userId)));
      if (existing) joinRequestStatus = existing.status;
    }

    const hasStarted = challenge.startDate ? new Date(challenge.startDate) <= new Date() : false;

    const visibleParticipants = isParticipant || isCreator
      ? participants
      : participants.map((p: any) => {
          if (p.user?.isPrivate) {
            return { ...p, user: { ...p.user, name: "Perfil Privado", avatar: "", username: "privado" } };
          }
          return p;
        });
    
    res.json({ ...challenge, participants: visibleParticipants, isParticipant, joinRequestStatus, hasStarted });
  });

  app.post("/api/challenges", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const body = { ...req.body, createdBy: userId };
      if (body.startDate && typeof body.startDate === "string") {
        body.startDate = new Date(body.startDate);
      }
      const data = insertChallengeSchema.parse(body);
      
      const entryFee = Number(data.entryFee || 0);
      if (entryFee > 0) {
        const { availableBalance } = await walletService.getBalance(userId);
        if (availableBalance < entryFee) {
          return res.status(400).json({ message: `Saldo insuficiente. Você tem R$ ${availableBalance.toFixed(2)} disponível, mas precisa de R$ ${entryFee.toFixed(2)} para criar este desafio.` });
        }
      }

      const startDateVal = data.startDate ? new Date(data.startDate) : new Date();
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const startCheck = new Date(startDateVal);
      startCheck.setHours(0, 0, 0, 0);
      if (startCheck < now) {
        return res.status(400).json({ message: "A data de início não pode ser no passado." });
      }
      const endDate = new Date(startDateVal);
      endDate.setDate(endDate.getDate() + (data.duration || 30));
      
      const challenge = await storage.createChallenge({ ...data, startDate: startDateVal, endDate });
      await storage.joinChallenge(challenge.id, userId, true);

      if (entryFee > 0) {
        await challengeFinanceService.processEntryFee(userId, challenge.id, entryFee, challenge.title);
      }
      
      res.status(201).json(challenge);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar desafio" });
    }
  });

  app.post("/api/challenges/:id/join", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;
      
      const existing = await storage.getParticipant(challengeId, userId);
      if (existing) return res.status(400).json({ message: "Você já está neste desafio" });
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });

      const hasStarted = challenge.startDate ? new Date(challenge.startDate) <= new Date() : true;
      if (hasStarted) return res.status(400).json({ message: "Este desafio já começou. Não é possível entrar." });
      
      const entryFee = Number(challenge.entryFee);
      if (entryFee > 0) {
        const { availableBalance } = await walletService.getBalance(userId);
        if (availableBalance < entryFee) {
          return res.status(400).json({ message: `Saldo insuficiente. Você tem R$ ${availableBalance.toFixed(2)} disponível, mas precisa de R$ ${entryFee.toFixed(2)} para entrar.` });
        }
        await challengeFinanceService.processEntryFee(userId, challengeId, entryFee, challenge.title);
      }
      
      const participant = await storage.joinChallenge(challengeId, userId);
      res.status(201).json(participant);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao entrar no desafio" });
    }
  });

  app.post("/api/challenges/:id/request-join", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });

      const hasStarted = challenge.startDate ? new Date(challenge.startDate) <= new Date() : false;
      if (hasStarted && challenge.status === "active") return res.status(400).json({ message: "Este desafio já começou. Não é possível pedir para entrar." });
      if (challenge.status === "completed" || challenge.status === "finalized") return res.status(400).json({ message: "Este desafio já foi finalizado." });

      const existing = await storage.getParticipant(challengeId, userId);
      if (existing) return res.status(400).json({ message: "Você já está neste desafio" });

      const [existingRequest] = await db.select().from(challengeJoinRequests)
        .where(and(eq(challengeJoinRequests.challengeId, challengeId), eq(challengeJoinRequests.userId, userId)));
      if (existingRequest) {
        if (existingRequest.status === "pending") return res.status(400).json({ message: "Você já tem uma solicitação pendente" });
        if (existingRequest.status === "rejected") return res.status(400).json({ message: "Sua solicitação foi recusada pelo moderador" });
      }

      const [request] = await db.insert(challengeJoinRequests).values({
        challengeId,
        userId,
      }).returning();

      const requester = await storage.getUser(userId);
      notificationService.notify(challenge.createdBy, {
        type: "join_request",
        title: "Pedido de entrada",
        body: `${requester?.name || "Alguém"} quer participar de "${challenge.title}"`,
        actionUrl: `/challenge/${challengeId}`,
        challengeId,
        fromUserId: userId,
      }).catch(() => {});

      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao solicitar entrada" });
    }
  });

  app.get("/api/challenges/:id/join-requests", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode ver solicitações" });

      const { users } = await import("@shared/schema");
      const requests = await db.select({
        id: challengeJoinRequests.id,
        challengeId: challengeJoinRequests.challengeId,
        userId: challengeJoinRequests.userId,
        status: challengeJoinRequests.status,
        createdAt: challengeJoinRequests.createdAt,
        userName: users.name,
        userAvatar: users.avatar,
        userUsername: users.username,
      }).from(challengeJoinRequests)
        .innerJoin(users, eq(challengeJoinRequests.userId, users.id))
        .where(eq(challengeJoinRequests.challengeId, challengeId))
        .orderBy(challengeJoinRequests.createdAt);

      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/join-requests/:requestId/approve", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { id: challengeId, requestId } = req.params;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode aprovar" });

      const [request] = await db.select().from(challengeJoinRequests).where(eq(challengeJoinRequests.id, requestId));
      if (!request || request.challengeId !== challengeId) return res.status(404).json({ message: "Solicitação não encontrada" });
      if (request.status !== "pending") return res.status(400).json({ message: "Solicitação já foi processada" });

      const currentParticipants = await storage.getChallengeParticipants(challengeId);
      const activeCount = currentParticipants.filter((p: any) => p.isActive !== false).length;
      if (challenge.maxParticipants && activeCount >= challenge.maxParticipants) {
        return res.status(400).json({ message: `Limite de ${challenge.maxParticipants} participantes atingido. Aumente o limite nas configurações do desafio antes de aprovar.` });
      }

      await db.update(challengeJoinRequests).set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: userId,
      }).where(eq(challengeJoinRequests.id, requestId));

      const entryFee = Number(challenge.entryFee);
      if (entryFee > 0) {
        const { availableBalance } = await walletService.getBalance(request.userId);
        if (availableBalance < entryFee) {
          await db.update(challengeJoinRequests).set({ status: "rejected", reviewedAt: new Date(), reviewedBy: userId })
            .where(eq(challengeJoinRequests.id, requestId));
          return res.status(400).json({ message: "Usuário não tem saldo suficiente. Solicitação recusada." });
        }
        await challengeFinanceService.processEntryFee(request.userId, challengeId, entryFee, challenge.title);
      }

      await storage.joinChallenge(challengeId, request.userId);
      
      notificationService.notify(request.userId, {
        type: "join_approved",
        title: "Entrada aprovada!",
        body: `Você foi aprovado no desafio "${challenge.title}"`,
        actionUrl: `/challenge/${challengeId}`,
        challengeId,
      }).catch(() => {});

      res.json({ message: "Participante aprovado com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/join-requests/:requestId/reject", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { id: challengeId, requestId } = req.params;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode recusar" });

      const [request] = await db.select().from(challengeJoinRequests).where(eq(challengeJoinRequests.id, requestId));
      if (!request || request.challengeId !== challengeId) return res.status(404).json({ message: "Solicitação não encontrada" });
      if (request.status !== "pending") return res.status(400).json({ message: "Solicitação já foi processada" });

      await db.update(challengeJoinRequests).set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: userId,
      }).where(eq(challengeJoinRequests.id, requestId));

      res.json({ message: "Solicitação recusada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/challenges/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode editar" });

      const allowed: (keyof typeof challenge)[] = ["title", "description", "rules", "isPrivate", "maxParticipants", "skipWeekends", "restDays", "restDaysAllowed"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Nenhum campo para atualizar" });
      }

      const updated = await storage.updateChallenge(req.params.id, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/transfer-creator", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;
      const { newCreatorId } = req.body;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode transferir a moderação" });
      if (!newCreatorId) return res.status(400).json({ message: "Selecione o novo moderador" });
      if (newCreatorId === userId) return res.status(400).json({ message: "Você já é o moderador" });

      const newCreatorParticipant = await storage.getParticipant(challengeId, newCreatorId);
      if (!newCreatorParticipant || !newCreatorParticipant.isActive) {
        return res.status(400).json({ message: "O novo moderador precisa ser um participante ativo" });
      }

      await db.update(challenges).set({ createdBy: newCreatorId }).where(eq(challenges.id, challengeId));

      const newCreator = await storage.getUser(newCreatorId);
      notificationService.notify(newCreatorId, {
        type: "moderator_transfer",
        title: "Você é o novo moderador!",
        body: `Você foi nomeado moderador do desafio "${challenge.title}"`,
        actionUrl: `/challenge/${challengeId}`,
        challengeId,
      }).catch(() => {});

      res.json({ success: true, message: `Moderação transferida para ${newCreator?.name || "novo moderador"}` });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao transferir moderação" });
    }
  });

  app.post("/api/challenges/:id/quit", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (!challenge.isActive) return res.status(400).json({ message: "Este desafio já foi finalizado" });

      const participant = await storage.getParticipant(challengeId, userId);
      if (!participant || !participant.isActive) {
        return res.status(400).json({ message: "Você não está participando deste desafio" });
      }

      if (challenge.createdBy === userId) {
        return res.status(400).json({ message: "Transfira a moderação para outro participante antes de desistir." });
      }

      const entryFee = Number(challenge.entryFee);

      await storage.leaveChallenge(challengeId, userId);

      if (entryFee > 0) {
        await walletService.deductLockedBalance(userId, entryFee);

        await transactionService.create({
          userId,
          type: TRANSACTION_TYPES.CHALLENGE_ENTRY,
          amount: entryFee,
          status: TRANSACTION_STATUS.COMPLETED,
          description: `Desistência: ${challenge.title} (valor perdido)`,
          challengeId,
          metadata: { action: "quit", forfeit: true },
        });
      }

      res.json({
        success: true,
        message: `Você desistiu do desafio "${challenge.title}". O valor de entrada de R$ ${entryFee.toFixed(2)} foi perdido e permanece no pote do desafio.`,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao desistir do desafio" });
    }
  });

  app.post("/api/challenges/:id/finalize", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode finalizar" });
      
      const { winnerUserIds } = req.body;
      if (!Array.isArray(winnerUserIds) || winnerUserIds.length === 0) {
        return res.status(400).json({ message: "Informe os vencedores" });
      }
      
      const result = await challengeFinanceService.finalizeChallenge(challengeId, winnerUserIds);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao finalizar desafio" });
    }
  });

  // ====== DAILY MISSED DAYS ENFORCEMENT ======

  app.post("/api/admin/reset-wallets", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });

      if (req.body?.confirmation !== "RESETAR_SALDOS") {
        return res.status(400).json({ message: "Confirmação inválida" });
      }

      const beforeReset = await db.execute(sql`SELECT COUNT(*) as count, COALESCE(SUM(ABS(balance)), 0) as total FROM wallets WHERE balance != 0`);
      const usersAffected = Number(beforeReset.rows[0]?.count || 0);
      const totalCleared = Number(beforeReset.rows[0]?.total || 0);

      await db.execute(sql`UPDATE wallets SET balance = 0, locked_balance = 0`);
      await db.execute(sql`DELETE FROM wallet_transactions`);

      res.json({ message: "Todos os saldos foram resetados para R$ 0,00", usersAffected, totalCleared });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Erro ao resetar saldos" });
    }
  });

  app.post("/api/admin/process-missed-days", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });

      const allChallenges = await storage.getChallenges();
      const activeChallenges = allChallenges.filter((c: any) => c.status === "active" && c.isActive);
      const today = new Date().toISOString().slice(0, 10);
      let totalEliminated = 0;

      for (const challenge of activeChallenges) {
        const cType = challenge.type;
        if (cType !== "checkin" && cType !== "survival") continue;

        const todayDate = new Date(today);
        const dayOfWeek = todayDate.getDay().toString();

        const challengeRestDays: string[] = (challenge as any).restDays || [];
        if (challengeRestDays.length > 0 && challengeRestDays.includes(dayOfWeek)) continue;

        const isWeekend = dayOfWeek === "0" || dayOfWeek === "6";
        if ((challenge as any).skipWeekends && isWeekend) continue;

        const maxMissed = cType === "checkin" ? 0 : ((challenge as any).maxMissedDays ?? 3);
        const restDaysAllowed = (challenge as any).restDaysAllowed || 0;
        const participants = await storage.getChallengeParticipants(challenge.id);
        const activeParticipants = participants.filter((p: any) => p.isActive !== false);

        for (const p of activeParticipants) {
          if (p.isAdmin) continue;
          const lastCheckin = (p as any).lastCheckInDate;
          if (lastCheckin === today) continue;

          const restDaysUsed = (p as any).restDaysUsed || 0;
          if (restDaysAllowed > 0 && restDaysUsed < restDaysAllowed) {
            await storage.updateChallengeParticipant(p.id, {
              restDaysUsed: restDaysUsed + 1,
              lastCheckInDate: today,
            } as any);
            continue;
          }

          const currentMissed = ((p as any).missedDays || 0) + 1;
          await storage.updateChallengeParticipant(p.id, {
            missedDays: currentMissed,
            lastCheckInDate: today,
          } as any);

          if (currentMissed > maxMissed) {
            await storage.updateChallengeParticipant(p.id, { isActive: false } as any);
            totalEliminated++;
          }
        }
      }

      res.json({ processed: activeChallenges.length, eliminated: totalEliminated, date: today });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Erro ao processar missed days" });
    }
  });

  // ====== REST DAY ======

  app.post("/api/challenges/:id/use-rest-day", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });

      const restDaysAllowed = (challenge as any).restDaysAllowed || 0;
      if (restDaysAllowed <= 0) return res.status(400).json({ message: "Este desafio não permite dias de descanso" });

      const participant = await storage.getParticipant(req.params.id, userId);
      if (!participant) return res.status(404).json({ message: "Você não participa deste desafio" });
      if (!participant.isActive) return res.status(400).json({ message: "Você já foi eliminado" });

      const restDaysUsed = (participant as any).restDaysUsed || 0;
      if (restDaysUsed >= restDaysAllowed) {
        return res.status(400).json({ message: `Você já usou todos os ${restDaysAllowed} dias de descanso` });
      }

      const today = new Date().toISOString().slice(0, 10);
      await storage.updateChallengeParticipant(participant.id, {
        restDaysUsed: restDaysUsed + 1,
        lastCheckInDate: today,
      } as any);

      res.json({ 
        message: "Dia de descanso registrado!", 
        restDaysUsed: restDaysUsed + 1, 
        restDaysRemaining: restDaysAllowed - restDaysUsed - 1 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ====== CHECK-INS ======

  app.post("/api/upload/challenge-banner", requireAuth, async (req, res) => {
    try {
      const buffer = req.body as Buffer;
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ message: "Nenhum dado recebido" });
      }
      const filename = `${randomUUID()}.jpg`;
      const uploadDir = path.join(process.cwd(), "server/uploads/banners");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      res.json({ url: `/uploads/banners/${filename}` });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao fazer upload do banner" });
    }
  });

  const checkinUploadDir = path.join(process.cwd(), "server/uploads/checkins");
  if (!fs.existsSync(checkinUploadDir)) fs.mkdirSync(checkinUploadDir, { recursive: true });

  app.post("/api/upload/checkin-photo", requireAuth, async (req, res) => {
    try {
      const buffer = req.body as Buffer;
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ message: "Nenhum dado recebido" });
      }
      const filename = `${randomUUID()}.jpg`;
      if (!fs.existsSync(checkinUploadDir)) fs.mkdirSync(checkinUploadDir, { recursive: true });
      fs.writeFileSync(path.join(checkinUploadDir, filename), buffer);
      res.json({ url: `/uploads/checkins/${filename}` });
    } catch (error: any) {
      console.error("Erro ao salvar foto de check-in:", error);
      res.status(500).json({ message: "Erro ao fazer upload da foto" });
    }
  });

  app.post("/api/check-ins/start", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { challengeId, photoUrl, backPhotoUrl, latitude, longitude, isIndoor } = req.body;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });

      const challengeStartDate = challenge.startDate ? new Date(challenge.startDate) : null;
      if (challengeStartDate && challengeStartDate > new Date()) {
        return res.status(400).json({ message: "Este desafio ainda não começou. Aguarde a data de início." });
      }
      if (!challenge.isActive || challenge.status === "completed") {
        return res.status(400).json({ message: "Este desafio já foi finalizado." });
      }

      const participant = await storage.getParticipant(challengeId, userId);
      if (!participant) return res.status(400).json({ message: "Você não está neste desafio" });

      const existing = await db.select().from(checkIns)
        .where(and(eq(checkIns.challengeId, challengeId), eq(checkIns.userId, userId), eq(checkIns.status, "active")));
      if (existing.length > 0) return res.status(400).json({ message: "Você já tem um check-in ativo", checkIn: existing[0] });

      const locName = await reverseGeocode(latitude, longitude);

      const [checkIn] = await db.insert(checkIns).values({
        challengeId,
        userId,
        status: "active",
        photoUrl: photoUrl || "",
        backPhotoUrl: backPhotoUrl || "",
        latitude: latitude || null,
        longitude: longitude || null,
        isIndoor: isIndoor || false,
        locationName: locName,
      }).returning();

      res.status(201).json(checkIn);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao iniciar check-in" });
    }
  });

  app.post("/api/check-ins/:checkInId/checkout", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { checkInId } = req.params;
      const { endPhotoUrl, endBackPhotoUrl, endLatitude, endLongitude, distanceKm, caloriesBurned, avgPace, indoorProofPhotoUrl, reps } = req.body;

      const [checkIn] = await db.select().from(checkIns).where(eq(checkIns.id, checkInId));
      if (!checkIn) return res.status(404).json({ message: "Check-in não encontrado" });
      if (checkIn.userId !== userId) return res.status(403).json({ message: "Sem permissão" });
      if (checkIn.status !== "active") return res.status(400).json({ message: "Check-in já finalizado" });

      const now = new Date();
      const startTime = new Date(checkIn.createdAt!);
      const durationMins = Math.max(1, Math.round((now.getTime() - startTime.getTime()) / 60000));

      const endLocName = await reverseGeocode(endLatitude, endLongitude);

      let flagged = false;
      let flagReason = "";
      if (!checkIn.isIndoor && checkIn.latitude && checkIn.longitude && endLatitude && endLongitude) {
        const dist = haversineDistanceServer(
          parseFloat(checkIn.latitude), parseFloat(checkIn.longitude),
          parseFloat(endLatitude), parseFloat(endLongitude)
        );
        if (dist > 2) {
          flagged = true;
          flagReason = `Localização diferente: check-in em "${checkIn.locationName || "desconhecido"}" e check-out em "${endLocName || "desconhecido"}" (${dist.toFixed(1)}km de distância)`;
        }
      }

      if (checkIn.isIndoor && distanceKm && !indoorProofPhotoUrl) {
        flagged = true;
        flagReason = flagReason ? flagReason + " | " : "";
        flagReason += "Indoor sem foto de comprovação do equipamento";
      }

      const [updated] = await db.update(checkIns).set({
        status: "completed",
        endPhotoUrl: endPhotoUrl || "",
        endBackPhotoUrl: endBackPhotoUrl || "",
        endLatitude: endLatitude || null,
        endLongitude: endLongitude || null,
        endLocationName: endLocName,
        distanceKm: distanceKm || null,
        durationMins,
        caloriesBurned: caloriesBurned || null,
        avgPace: avgPace || null,
        reps: reps ? parseInt(reps) : null,
        indoorProofPhotoUrl: indoorProofPhotoUrl || "",
        flagged,
        flagReason,
        checkedOutAt: now,
      }).where(eq(checkIns.id, checkInId)).returning();

      const [challenge] = await db.select().from(challenges).where(eq(challenges.id, checkIn.challengeId));
      const participant = await storage.getParticipant(checkIn.challengeId, userId);
      if (participant) {
        const challengeType = challenge?.type || "checkin";
        const vType = challenge?.validationType || "foto";
        const today = now.toISOString().split("T")[0];
        const dist = distanceKm ? parseFloat(distanceKm) : 0;
        const newTotalDist = parseFloat(String(participant.totalDistanceKm || "0")) + dist;
        const newTotalDuration = (participant.totalDurationMins || 0) + durationMins;
        const newScore = (participant.score || 0) + 1;

        const updates: Record<string, any> = {
          score: newScore,
          totalDistanceKm: newTotalDist.toFixed(3),
          totalDurationMins: newTotalDuration,
          lastCheckInDate: today,
        };

        if (challengeType === "corrida" && vType === "distancia") {
          updates.score = Math.round(newTotalDist * 100);
        } else if (challengeType === "corrida" && vType === "repeticoes") {
          const totalReps = newScore;
          updates.score = totalReps;
        } else if (challengeType === "corrida" && vType === "tempo") {
          updates.score = newTotalDuration;
        } else if (challengeType === "ranking" && vType === "distancia") {
          updates.score = Math.round(newTotalDist * 100);
        } else if (challengeType === "ranking" && vType === "tempo") {
          updates.score = newTotalDuration;
        } else if (challengeType === "ranking" && vType === "repeticoes") {
          const r = reps ? parseInt(reps) : 0;
          updates.score = (participant.score || 0) + r;
        }

        await db.update(challengeParticipants).set(updates)
          .where(and(
            eq(challengeParticipants.challengeId, checkIn.challengeId),
            eq(challengeParticipants.userId, userId)
          ));
      }

      const currentUser = await storage.getUser(userId);
      const userName = currentUser?.name || "Alguém";
      const dLabel = updated.durationMins ? `${updated.durationMins} min` : "";
      const distLabel = updated.distanceKm && parseFloat(updated.distanceKm) > 0 ? ` • ${parseFloat(updated.distanceKm).toFixed(1)}km` : "";
      notificationService.notifyChallengeParticipants(
        checkIn.challengeId,
        userId,
        {
          type: "checkin_activity",
          title: `${userName} fez check-in!`,
          body: `${userName} completou um treino no desafio "${challenge?.title || ""}"${dLabel ? ` (${dLabel}${distLabel})` : ""}`,
          icon: "camera",
          actionUrl: `/challenge/${checkIn.challengeId}`,
        }
      ).catch(() => {});

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao fazer check-out" });
    }
  });

  app.get("/api/check-ins/active", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const active = await db.select().from(checkIns)
      .where(and(eq(checkIns.userId, userId), eq(checkIns.status, "active")));
    res.json(active);
  });

  app.post("/api/check-ins/location-update", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { checkInId, latitude, longitude } = req.body;

      const [checkIn] = await db.select().from(checkIns).where(eq(checkIns.id, checkInId));
      if (!checkIn || checkIn.userId !== userId || checkIn.status !== "active") {
        return res.json({ reminder: false });
      }

      if (checkIn.latitude && checkIn.longitude && latitude && longitude) {
        const startLat = parseFloat(checkIn.latitude);
        const startLng = parseFloat(checkIn.longitude);
        const curLat = parseFloat(latitude);
        const curLng = parseFloat(longitude);

        const R = 6371;
        const dLat = (curLat - startLat) * Math.PI / 180;
        const dLon = (curLng - startLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(startLat * Math.PI / 180) * Math.cos(curLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        if (!checkIn.isIndoor && distKm > 0.5) {
          const challenge = await storage.getChallenge(checkIn.challengeId);
          notificationService.notify(userId, {
            type: "checkout_reminder",
            title: "Lembrete de Check-out",
            body: `Parece que você saiu do local. Não esqueça de fazer o check-out do desafio "${challenge?.title || ""}"!`,
            actionUrl: `/check-in/${checkIn.challengeId}`,
            challengeId: checkIn.challengeId,
          }).catch(() => {});
          return res.json({ reminder: true, distance: distKm });
        }
      }

      res.json({ reminder: false });
    } catch (error: any) {
      res.json({ reminder: false });
    }
  });

  app.post("/api/check-ins", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const data = insertCheckInSchema.parse({ ...req.body, userId });
      
      const participant = await storage.getParticipant(data.challengeId, userId);
      if (!participant) return res.status(400).json({ message: "Você não está neste desafio" });
      
      const checkIn = await storage.createCheckIn(data);
      await storage.updateParticipantScore(data.challengeId, userId, (participant.score || 0) + 1);
      
      res.status(201).json(checkIn);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao fazer check-in" });
    }
  });

  app.get("/api/check-ins/:challengeId/flagged", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.challengeId;
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge || challenge.createdBy !== userId) {
        return res.status(403).json({ message: "Sem permissão" });
      }
      const flaggedCheckIns = await db.select({
        checkIn: checkIns,
        user: { id: users.id, name: users.name, username: users.username, avatar: users.avatar },
      }).from(checkIns)
        .innerJoin(users, eq(checkIns.userId, users.id))
        .where(and(eq(checkIns.challengeId, challengeId), eq(checkIns.flagged, true)))
        .orderBy(desc(checkIns.createdAt));
      res.json(flaggedCheckIns);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.get("/api/check-ins/:challengeId", requireAuth, async (req, res) => {
    const checkIns = await storage.getChallengeCheckIns(req.params.challengeId);
    res.json(checkIns);
  });

  // ====== CHALLENGE MESSAGES ======

  app.get("/api/challenges/:id/messages", requireAuth, async (req, res) => {
    const msgs = await storage.getChallengeMessages(req.params.id);
    res.json(msgs);
  });

  app.post("/api/challenges/:id/messages", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;
      const { text, audioUrl } = req.body;

      if (!text || !text.trim()) return res.status(400).json({ message: "Mensagem vazia" });

      const participant = await storage.getParticipant(challengeId, userId);
      if (!participant || !participant.isActive) {
        return res.status(403).json({ message: "Apenas participantes podem enviar mensagens" });
      }

      const msg = await storage.createChallengeMessage({ challengeId, userId, text: text.trim(), ...(audioUrl ? { audioUrl } : {}) });
      const user = await storage.getUser(userId);
      res.status(201).json({
        ...msg,
        user: { id: user!.id, name: user!.name, avatar: user!.avatar, username: user!.username },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao enviar mensagem" });
    }
  });

  // ====== MESSAGES ======

  app.get("/api/messages/conversations", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const conversations = await storage.getUserConversations(userId);
    const myFollowers = await storage.getFollowers(userId);
    const followerIds = new Set(myFollowers.map(f => f.followerId));

    const allMsgs = await db.select().from(messages)
      .where(eq(messages.senderId, userId));
    const repliedToIds = new Set(allMsgs.map(m => m.receiverId));

    res.json(conversations.map(c => ({
      user: { ...c.user, password: undefined, twoFactorSecret: undefined },
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount,
      isFollower: followerIds.has(c.user.id) || repliedToIds.has(c.user.id),
    })));
  });

  app.get("/api/messages/:username", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const otherUser = await storage.getUserByUsername(req.params.username);
    if (!otherUser) return res.status(404).json({ message: "Usuário não encontrado" });
    
    const msgs = await storage.getConversation(userId, otherUser.id);
    await storage.markMessagesRead(otherUser.id, userId);
    res.json(msgs);
  });

  app.use("/uploads", (await import("express")).default.static(path.join(process.cwd(), "server/uploads")));

  app.post("/api/upload/audio", requireAuth, async (req, res) => {
    try {
      const buffer = req.body as Buffer;
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ message: "Nenhum dado recebido" });
      }
      const contentType = req.headers["content-type"] || "audio/webm";
      const extMap: Record<string, string> = {
        "audio/webm": ".webm",
        "audio/webm;codecs=opus": ".webm",
        "audio/ogg": ".ogg",
        "audio/ogg;codecs=opus": ".ogg",
        "audio/mp4": ".m4a",
        "audio/aac": ".aac",
        "audio/mpeg": ".mp3",
        "audio/mp3": ".mp3",
        "audio/wav": ".wav",
      };
      const ct = (typeof contentType === "string" ? contentType : contentType[0] || "audio/webm").toLowerCase();
      const ext = extMap[ct.split(";")[0].trim()] || ".webm";
      const filename = `${randomUUID()}${ext}`;
      const uploadDir = path.join(process.cwd(), "server/uploads/audio");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      res.json({ url: `/uploads/audio/${filename}` });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao fazer upload do áudio" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const senderId = (req.session as any).userId;
      const { receiverUsername, text, replyToId, audioUrl } = req.body;
      
      const receiver = await storage.getUserByUsername(receiverUsername);
      if (!receiver) return res.status(404).json({ message: "Usuário não encontrado" });
      
      const sender = await storage.getUser(senderId);
      const message = await storage.sendMessage({
        senderId,
        receiverId: receiver.id,
        text,
        replyToId: replyToId || null,
        audioUrl: audioUrl || null,
      });
      
      notificationService.notify(receiver.id, {
        type: "new_message",
        title: sender?.name || "Nova mensagem",
        body: audioUrl ? "Mensagem de voz" : (text?.length > 80 ? text.slice(0, 80) + "..." : text),
        actionUrl: `/messages/${sender?.username}`,
        fromUserId: senderId,
      }).catch(() => {});

      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao enviar mensagem" });
    }
  });

  // ====== FOLLOWS ======

  app.post("/api/follows/:username", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const target = await storage.getUserByUsername(req.params.username);
      if (!target) return res.status(404).json({ message: "Usuário não encontrado" });
      if (target.id === userId) return res.status(400).json({ message: "Não pode seguir a si mesmo" });

      const alreadyFollowing = await storage.isFollowing(userId, target.id);
      if (alreadyFollowing) return res.status(400).json({ message: "Já está seguindo" });

      const currentUser = await storage.getUser(userId);

      if (target.isPrivate) {
        const existing = await db.select().from(followRequests)
          .where(and(eq(followRequests.requesterId, userId), eq(followRequests.targetId, target.id), eq(followRequests.status, "pending")));
        if (existing.length > 0) return res.status(400).json({ message: "Solicitação já enviada" });

        const [request] = await db.insert(followRequests).values({ requesterId: userId, targetId: target.id }).returning();
        
        notificationService.notify(target.id, {
          type: "follow_request",
          title: "Solicitação de seguir",
          body: `${currentUser?.name || "Alguém"} quer te seguir`,
          actionUrl: "/settings",
          fromUserId: userId,
        }).catch(() => {});

        return res.status(201).json({ ...request, type: "request" });
      }

      const follow = await storage.follow(userId, target.id);
      
      notificationService.notify(target.id, {
        type: "new_follower",
        title: "Novo seguidor",
        body: `${currentUser?.name || "Alguém"} começou a te seguir`,
        actionUrl: `/profile/${currentUser?.username}`,
        fromUserId: userId,
      }).catch(() => {});

      res.status(201).json(follow);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro" });
    }
  });

  app.delete("/api/follows/:username", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const target = await storage.getUserByUsername(req.params.username);
    if (!target) return res.status(404).json({ message: "Usuário não encontrado" });
    
    await storage.unfollow(userId, target.id);
    await db.delete(followRequests).where(and(eq(followRequests.requesterId, userId), eq(followRequests.targetId, target.id)));
    res.json({ message: "Unfollowed" });
  });

  app.get("/api/follows/status/:username", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const target = await storage.getUserByUsername(req.params.username);
    if (!target) return res.status(404).json({ following: false, requested: false });
    const following = await storage.isFollowing(userId, target.id);
    const [pendingReq] = await db.select().from(followRequests)
      .where(and(eq(followRequests.requesterId, userId), eq(followRequests.targetId, target.id), eq(followRequests.status, "pending")));
    res.json({ following, requested: !!pendingReq });
  });

  app.get("/api/follows/followers", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const followers = await storage.getFollowers(userId);
    res.json(followers.map(f => ({ ...f, follower: { ...f.follower, password: undefined } })));
  });

  app.get("/api/follows/following", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const following = await storage.getFollowing(userId);
    res.json(following.map(f => ({ ...f, following: { ...f.following, password: undefined } })));
  });

  app.get("/api/follows/requests", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const requests = await db.select()
      .from(followRequests)
      .innerJoin(users, eq(followRequests.requesterId, users.id))
      .where(and(eq(followRequests.targetId, userId), eq(followRequests.status, "pending")));
    res.json(requests.map(r => ({
      ...r.follow_requests,
      requester: { ...r.users, password: undefined },
    })));
  });

  app.post("/api/follows/requests/:id/approve", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const [request] = await db.select().from(followRequests).where(eq(followRequests.id, req.params.id));
      if (!request) return res.status(404).json({ message: "Solicitação não encontrada" });
      if (request.targetId !== userId) return res.status(403).json({ message: "Sem permissão" });

      await db.update(followRequests).set({ status: "approved", reviewedAt: new Date() }).where(eq(followRequests.id, req.params.id));
      await storage.follow(request.requesterId, request.targetId);
      
      const approver = await storage.getUser(request.targetId);
      notificationService.notify(request.requesterId, {
        type: "follow_accepted",
        title: "Pedido aceito!",
        body: `${approver?.name || "Alguém"} aceitou seu pedido de seguir`,
        actionUrl: `/profile/${approver?.username}`,
        fromUserId: request.targetId,
      }).catch(() => {});

      res.json({ message: "Aprovado" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro" });
    }
  });

  app.post("/api/follows/requests/:id/reject", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const [request] = await db.select().from(followRequests).where(eq(followRequests.id, req.params.id));
    if (!request) return res.status(404).json({ message: "Solicitação não encontrada" });
    if (request.targetId !== userId) return res.status(403).json({ message: "Sem permissão" });

    await db.update(followRequests).set({ status: "rejected", reviewedAt: new Date() }).where(eq(followRequests.id, req.params.id));
    res.json({ message: "Rejeitado" });
  });

  app.get("/api/users/:username/suggested", async (req, res) => {
    try {
      const target = await storage.getUserByUsername(req.params.username);
      if (!target) return res.status(404).json([]);

      const targetFollowing = await storage.getFollowing(target.id);
      const targetFollowingIds = new Set(targetFollowing.map(f => f.followingId));
      const targetFollowers = await storage.getFollowers(target.id);
      const targetFollowerIds = new Set(targetFollowers.map(f => f.followerId));

      const userId = (req as any).session?.userId;
      const excludeIds = new Set([target.id, userId].filter(Boolean));

      const friendsOfFriendsIds = new Set<string>();
      for (const f of targetFollowing) {
        const theirFollowing = await storage.getFollowing(f.followingId);
        for (const ff of theirFollowing) {
          if (!excludeIds.has(ff.followingId) && !targetFollowingIds.has(ff.followingId)) {
            friendsOfFriendsIds.add(ff.followingId);
          }
        }
      }

      const allUsers = await db.select().from(users);

      const suggested = allUsers
        .filter(u => friendsOfFriendsIds.has(u.id))
        .slice(0, 10)
        .map(u => ({ id: u.id, name: u.name, username: u.username, avatar: u.avatar, bio: u.bio }));

      if (suggested.length < 5) {
        const usedIds = new Set([...excludeIds, ...targetFollowingIds, ...suggested.map(s => s.id)]);
        const extras = allUsers
          .filter(u => !usedIds.has(u.id))
          .slice(0, 5 - suggested.length)
          .map(u => ({ id: u.id, name: u.name, username: u.username, avatar: u.avatar, bio: u.bio }));
        suggested.push(...extras);
      }

      res.json(suggested);
    } catch {
      res.json([]);
    }
  });

  // ====== COMMUNITIES ======

  app.get("/api/communities", async (req, res) => {
    const allComms = await storage.getCommunities();
    const result = [];
    for (const comm of allComms) {
      const activeChallenges = await db.select({ count: sql<number>`count(*)::int` })
        .from(challenges)
        .where(and(eq(challenges.communityId, comm.id), eq(challenges.isActive, true)));
      result.push({ ...comm, activeChallenges: activeChallenges[0]?.count || 0 });
    }
    res.json(result);
  });

  app.get("/api/communities/:id", async (req, res) => {
    const community = await storage.getCommunity(req.params.id);
    if (!community) return res.status(404).json({ message: "Comunidade não encontrada" });
    const members = await storage.getCommunityMembers(req.params.id);
    const activeChallenges = await db.select({ count: sql<number>`count(*)::int` })
      .from(challenges)
      .where(and(eq(challenges.communityId, community.id), eq(challenges.isActive, true)));
    res.json({ ...community, members, memberCount: members.length, activeChallenges: activeChallenges[0]?.count || 0 });
  });

  app.post("/api/communities", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const data = insertCommunitySchema.parse({ ...req.body, createdBy: userId });
      const community = await storage.createCommunity(data);
      await storage.joinCommunity(community.id, userId);
      res.status(201).json(community);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar comunidade" });
    }
  });

  app.post("/api/communities/:id/join", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const member = await storage.joinCommunity(req.params.id, userId);
    res.status(201).json(member);
  });

  app.delete("/api/communities/:id/leave", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.leaveCommunity(req.params.id, userId);
    res.json({ message: "Saiu da comunidade" });
  });

  app.get("/api/communities/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const userComms = await storage.getUserCommunities(userId);
    res.json(userComms);
  });

  // ====== WALLET ======

  app.get("/api/wallet/balance", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const walletBalance = await walletService.getBalance(userId);
      res.json(walletBalance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/wallet/transactions", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const txs = await transactionService.getUserTransactions(userId);
      res.json(txs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallet/deposit", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { amount } = req.body;
      const numAmount = Number(amount);

      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ message: "Valor inválido" });
      }
      if (numAmount < DEPOSIT_MINIMUM) {
        return res.status(400).json({ message: `Depósito mínimo: R$ ${DEPOSIT_MINIMUM},00` });
      }

      const idempotencyKey = transactionService.generateIdempotencyKey();

      const tx = await transactionService.create({
        userId,
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: numAmount,
        status: TRANSACTION_STATUS.PENDING,
        idempotencyKey,
        description: "Depósito via Pix",
      });

      if (paymentService.isConfigured()) {
        const user = await storage.getUser(userId);
        if (!user?.cpf) {
          await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.FAILED);
          return res.status(400).json({ message: "Configure seu CPF no perfil antes de depositar", needsCpf: true });
        }

        const amountInCents = Math.round(numAmount * 100);
        const charge = await paymentService.createPixCharge(
          amountInCents,
          `Depósito FitStake - R$ ${numAmount.toFixed(2)}`,
          tx.id,
          {
            name: user.name,
            email: user.email,
            cellphone: user.phone || "5500000000000",
            taxId: user.cpf,
          }
        );

        await transactionService.setExternalId(tx.id, charge.id);
        await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.PROCESSING, {
          pixUrl: charge.url,
          pixQrCode: charge.qrCode,
          pixQrCodeBase64: charge.qrCodeBase64,
        });

        res.status(201).json({
          transaction: tx,
          pix: {
            qrCode: charge.qrCode,
            qrCodeBase64: charge.qrCodeBase64,
            url: charge.url,
            chargeId: charge.id,
          },
        });
      } else {
        await walletService.addBalance(userId, numAmount);
        await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.COMPLETED);

        res.status(201).json({
          transaction: { ...tx, status: TRANSACTION_STATUS.COMPLETED },
          pix: null,
          message: "Depósito simulado (gateway não configurado)",
        });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao processar depósito" });
    }
  });

  app.post("/api/wallet/withdraw", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { amount, pixKey, pixKeyType } = req.body;
      const numAmount = Number(amount);

      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ message: "Valor inválido" });
      }
      if (numAmount < WITHDRAW_MINIMUM) {
        return res.status(400).json({ message: `Saque mínimo: R$ ${WITHDRAW_MINIMUM},00` });
      }
      if (!pixKey) {
        return res.status(400).json({ message: "Chave Pix obrigatória" });
      }

      const keyType = (pixKeyType || "CPF").toUpperCase();
      if (keyType === "CPF") {
        const cpfClean = pixKey.replace(/[.\-]/g, "");
        if (!/^\d{11}$/.test(cpfClean)) {
          return res.status(400).json({ message: "CPF inválido. Informe 11 dígitos numéricos." });
        }
      } else if (keyType === "EMAIL") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
          return res.status(400).json({ message: "E-mail inválido. Verifique o formato." });
        }
      } else if (keyType === "PHONE") {
        const phoneClean = pixKey.replace(/[\s\-\(\)\+]/g, "");
        if (!/^\d{10,13}$/.test(phoneClean)) {
          return res.status(400).json({ message: "Telefone inválido. Informe com DDD (ex: 11999999999)." });
        }
      } else if (keyType === "RANDOM" || keyType === "ALEATORIA") {
        if (!/^[a-f0-9\-]{32,36}$/i.test(pixKey)) {
          return res.status(400).json({ message: "Chave aleatória inválida. Verifique o formato UUID." });
        }
      }

      const { availableBalance } = await walletService.getBalance(userId);
      if (numAmount > availableBalance) {
        return res.status(400).json({ message: `Saldo disponível insuficiente. Você tem R$ ${availableBalance.toFixed(2)} disponível para saque.` });
      }

      const pending = await transactionService.getPendingWithdrawals(userId);
      if (pending.length > 0) {
        return res.status(400).json({ message: "Você já tem um saque pendente" });
      }

      await walletService.lockBalance(userId, numAmount);

      const idempotencyKey = transactionService.generateIdempotencyKey();
      const tx = await transactionService.create({
        userId,
        type: TRANSACTION_TYPES.WITHDRAW_REQUEST,
        amount: numAmount,
        status: TRANSACTION_STATUS.PENDING,
        idempotencyKey,
        description: "Saque via Pix",
        metadata: { pixKey, pixKeyType: pixKeyType || "CPF" },
      });

      if (paymentService.isConfigured()) {
        try {
          const amountInCents = Math.round(numAmount * 100);
          const withdraw = await paymentService.createPixWithdraw(
            amountInCents,
            pixKey,
            pixKeyType || "CPF",
            "Saque FitStake"
          );

          await transactionService.setExternalId(tx.id, withdraw.id);
          await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.PROCESSING);

          res.status(201).json({
            transaction: { ...tx, status: TRANSACTION_STATUS.PROCESSING },
            message: "Saque solicitado. O processamento pode levar alguns minutos.",
          });
        } catch (gatewayError: any) {
          await walletService.unlockBalance(userId, numAmount);
          const errorMsg = gatewayError.message || "Erro desconhecido";
          await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.FAILED, {
            error: errorMsg,
          });
          let userMessage = "Erro ao processar saque. ";
          if (errorMsg.toLowerCase().includes("key") || errorMsg.toLowerCase().includes("chave") || errorMsg.toLowerCase().includes("pix")) {
            userMessage += "Verifique se a chave Pix está correta e corresponde ao tipo selecionado.";
          } else if (errorMsg.toLowerCase().includes("insufficient") || errorMsg.toLowerCase().includes("saldo") || errorMsg.toLowerCase().includes("balance")) {
            userMessage += "Saldo insuficiente no gateway.";
          } else if (errorMsg.toLowerCase().includes("limit") || errorMsg.toLowerCase().includes("limite")) {
            userMessage += "Limite de saque excedido. Tente um valor menor.";
          } else {
            userMessage += `Detalhe: ${errorMsg}`;
          }
          res.status(400).json({ message: userMessage });
        }
      } else {
        await walletService.deductLockedBalance(userId, numAmount);
        await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.COMPLETED);

        res.status(201).json({
          transaction: { ...tx, status: TRANSACTION_STATUS.COMPLETED },
          message: "Saque processado.",
        });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao processar saque" });
    }
  });

  app.get("/api/wallet/deposit/:transactionId/status", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const tx = await transactionService.getTransaction(req.params.transactionId);
      if (!tx || tx.userId !== userId) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }

      if ((tx.status === TRANSACTION_STATUS.PROCESSING || tx.status === TRANSACTION_STATUS.PENDING) && tx.externalId && paymentService.isConfigured()) {
        try {
          const gatewayStatus = await paymentService.getChargeStatus(tx.externalId);
          console.log("[DepositStatus] Gateway status for", tx.externalId, ":", gatewayStatus);
          if (gatewayStatus === "COMPLETED" || gatewayStatus === "PAID") {
            await webhookService.processPaymentConfirmed(tx.externalId);
            const updated = await transactionService.getTransaction(tx.id);
            return res.json(updated);
          }
        } catch (err: any) {
          console.error("[DepositStatus] Error checking gateway:", err.message);
        }
      }

      res.json(tx);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ====== SUPPORT TICKETS ======

  app.post("/api/support", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { type, message } = req.body;

      if (!type || !message?.trim()) {
        return res.status(400).json({ message: "Tipo e mensagem são obrigatórios" });
      }
      if (!["feedback", "suporte", "ideia", "organizador", "parceiro"].includes(type)) {
        return res.status(400).json({ message: "Tipo inválido" });
      }

      const ticket = await storage.createSupportTicket({ userId, type, message: message.trim() });
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao enviar" });
    }
  });

  app.get("/api/support/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const all = await storage.getSupportTickets();
    res.json(all.filter(t => t.userId === userId));
  });

  // ====== AVATAR UPLOAD ======

  app.post("/api/users/avatar", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { avatar } = req.body;
      if (!avatar) return res.status(400).json({ message: "Avatar é obrigatório" });
      const updated = await storage.updateUser(userId, { avatar });
      if (!updated) return res.status(404).json({ message: "Usuário não encontrado" });
      res.json({ avatar: updated.avatar });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao atualizar avatar" });
    }
  });

  // ====== ADMIN ======

  const requireAdmin = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Não autenticado" });
    const user = await storage.getUser(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ message: "Acesso negado" });
    next();
  };

  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { transactions, wallets, users: usersTable, challenges: challengesTable } = await import("@shared/schema");
      const { sql, eq, and, gte, lte } = await import("drizzle-orm");

      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const dateFilters: any[] = [];
      if (from) dateFilters.push(gte(transactions.createdAt, new Date(from)));
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilters.push(lte(transactions.createdAt, toDate));
      }

      const txWhere = (type: string, extra?: any) => {
        const conditions: any[] = [eq(transactions.type, type)];
        if (extra) conditions.push(extra);
        conditions.push(...dateFilters);
        return and(...conditions);
      };

      const [feeResult] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(txWhere("platform_fee"));

      const [depositCompleted] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(txWhere("deposit", eq(transactions.status, "completed")));

      const [depositAll] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(txWhere("deposit"));

      const [withdrawAll] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(txWhere("withdraw_request"));

      const [walletResult] = await database.select({
        totalBalance: sql<string>`COALESCE(SUM(balance), 0)`,
        totalLocked: sql<string>`COALESCE(SUM(locked_balance), 0)`,
      }).from(wallets);

      const [userCountResult] = await database.select({ count: sql<number>`COUNT(*)` }).from(usersTable);
      const [challengeCount] = await database.select({ count: sql<number>`COUNT(*)` }).from(challengesTable);
      const [activeChallenges] = await database.select({ count: sql<number>`COUNT(*)` }).from(challengesTable).where(eq(challengesTable.isActive, true));

      const [challengeEntries] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(txWhere("challenge_entry"));

      const [challengeWins] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(txWhere("challenge_win"));

      res.json({
        platformFees: { total: Number(feeResult.total), count: Number(feeResult.count) },
        depositsCompleted: { total: Number(depositCompleted.total), count: Number(depositCompleted.count) },
        depositsAll: { total: Number(depositAll.total), count: Number(depositAll.count) },
        withdrawals: { total: Number(withdrawAll.total), count: Number(withdrawAll.count) },
        usersBalance: { total: Number(walletResult.totalBalance), locked: Number(walletResult.totalLocked) },
        challengeEntries: { total: Number(challengeEntries.total), count: Number(challengeEntries.count) },
        challengeWins: { total: Number(challengeWins.total), count: Number(challengeWins.count) },
        totalUsers: Number(userCountResult.count),
        totalChallenges: Number(challengeCount.count),
        activeChallenges: Number(activeChallenges.count),
        dateFilter: { from: from || null, to: to || null },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { transactions, users: usersTable } = await import("@shared/schema");
      const { desc, eq, and, gte, lte } = await import("drizzle-orm");

      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const conditions: any[] = [];
      if (from) conditions.push(gte(transactions.createdAt, new Date(from)));
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(transactions.createdAt, toDate));
      }

      const allTxs = await database.select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        status: transactions.status,
        description: transactions.description,
        metadata: transactions.metadata,
        createdAt: transactions.createdAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
      }).from(transactions)
        .leftJoin(usersTable, eq(transactions.userId, usersTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(transactions.createdAt))
        .limit(500);
      res.json(allTxs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { users: usersTable, wallets } = await import("@shared/schema");
      const { desc, eq, sql } = await import("drizzle-orm");

      const allUsers = await database.select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        name: usersTable.name,
        cpf: usersTable.cpf,
        phone: usersTable.phone,
        isAdmin: usersTable.isAdmin,
        role: usersTable.role,
        online: usersTable.online,
        pwaInstalled: usersTable.pwaInstalled,
        lastActiveAt: usersTable.lastActiveAt,
        createdAt: usersTable.createdAt,
        balance: sql<string>`COALESCE(w.balance, 0)`.as("balance"),
        lockedBalance: sql<string>`COALESCE(w.locked_balance, 0)`.as("locked_balance"),
      }).from(usersTable)
        .leftJoin(sql`wallets w`, sql`w.user_id = ${usersTable.id}`)
        .orderBy(desc(usersTable.createdAt));

      res.json(allUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/toggle-admin", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { users: usersTable } = await import("@shared/schema");
      const { eq, sql } = await import("drizzle-orm");

      const [target] = await database.select().from(usersTable).where(eq(usersTable.id, req.params.id));
      if (!target) return res.status(404).json({ message: "Usuário não encontrado" });

      await database.update(usersTable).set({ isAdmin: !target.isAdmin }).where(eq(usersTable.id, req.params.id));
      res.json({ success: true, isAdmin: !target.isAdmin });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/set-role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { users: usersTable } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const { role } = req.body;
      const validRoles = ["user", "organizer", "partner", "organizer_partner"];
      if (!validRoles.includes(role)) return res.status(400).json({ message: "Role inválido" });

      await database.update(usersTable).set({ role }).where(eq(usersTable.id, req.params.id));
      res.json({ success: true, role });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/block", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { users: usersTable } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      await database.update(usersTable).set({ online: false, isPrivate: true }).where(eq(usersTable.id, req.params.id));
      res.json({ success: true, message: "Usuário bloqueado" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/challenges", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { challenges: challengesTable, challengeParticipants, users: usersTable } = await import("@shared/schema");
      const { desc, eq, count } = await import("drizzle-orm");

      const allChallenges = await database.select().from(challengesTable).orderBy(desc(challengesTable.createdAt));
      const result = await Promise.all(allChallenges.map(async (c: any) => {
        const [partCount] = await database.select({ count: count() }).from(challengeParticipants).where(eq(challengeParticipants.challengeId, c.id));
        const [creator] = await database.select({ name: usersTable.name, username: usersTable.username }).from(usersTable).where(eq(usersTable.id, c.createdBy));
        return { ...c, participantCount: partCount?.count || 0, creatorName: creator?.name || creator?.username || "?" };
      }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/challenges/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { challenges: challengesTable, challengeParticipants, checkIns, challengeMessages, challengeJoinRequests } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [challenge] = await database.select().from(challengesTable).where(eq(challengesTable.id, req.params.id));
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });

      await database.delete(challengeMessages).where(eq(challengeMessages.challengeId, req.params.id));
      await database.delete(challengeJoinRequests).where(eq(challengeJoinRequests.challengeId, req.params.id));
      await database.delete(checkIns).where(eq(checkIns.challengeId, req.params.id));
      await database.delete(challengeParticipants).where(eq(challengeParticipants.challengeId, req.params.id));
      await database.delete(challengesTable).where(eq(challengesTable.id, req.params.id));

      res.json({ success: true, message: "Desafio removido com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { users: usersTable, wallets, transactions } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [target] = await database.select().from(usersTable).where(eq(usersTable.id, req.params.id));
      if (!target) return res.status(404).json({ message: "Usuário não encontrado" });
      if (target.isAdmin) return res.status(403).json({ message: "Não é possível apagar um admin" });

      await database.delete(transactions).where(eq(transactions.userId, req.params.id));
      await database.delete(wallets).where(eq(wallets.userId, req.params.id));
      await database.delete(usersTable).where(eq(usersTable.id, req.params.id));
      res.json({ success: true, message: "Usuário removido" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/support", requireAuth, requireAdmin, async (req, res) => {
    try {
      const tickets = await storage.getSupportTickets();
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/support/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      await storage.updateSupportTicketStatus(req.params.id, status, adminNotes);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/push/broadcast", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title, body, url } = req.body;
      if (!title || !body) return res.status(400).json({ message: "Título e mensagem são obrigatórios" });
      const userIds = await storage.getAllPushSubscribedUserIds();
      if (userIds.length === 0) return res.json({ sent: 0, failed: 0, total: 0 });
      const results = await pushService.sendToMultiple(userIds, { title, body, url: url || "/" });
      let sent = 0, failed = 0;
      results.forEach((r: any) => {
        if (r.status === "fulfilled") { sent += r.value.sent; failed += r.value.failed; }
        else { failed++; }
      });
      res.json({ sent, failed, total: userIds.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/push/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userIds = await storage.getAllPushSubscribedUserIds();
      res.json({ subscribedUsers: userIds.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/suspicious", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { transactions, users: usersTable } = await import("@shared/schema");
      const { sql, eq, desc } = await import("drizzle-orm");

      const highVolume = await database.select({
        userId: transactions.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        txCount: sql<number>`COUNT(*)`.as("tx_count"),
        totalAmount: sql<string>`SUM(amount)`.as("total_amount"),
      }).from(transactions)
        .leftJoin(usersTable, eq(transactions.userId, usersTable.id))
        .groupBy(transactions.userId, usersTable.name, usersTable.email)
        .having(sql`COUNT(*) > 5 OR SUM(amount) > 500`)
        .orderBy(sql`SUM(amount) DESC`);

      const failedTxs = await database.select({
        id: transactions.id,
        userId: transactions.userId,
        userName: usersTable.name,
        type: transactions.type,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
      }).from(transactions)
        .leftJoin(usersTable, eq(transactions.userId, usersTable.id))
        .where(eq(transactions.status, "failed"))
        .orderBy(desc(transactions.createdAt))
        .limit(20);

      const rapidDeposits = await database.select({
        userId: transactions.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        depositCount: sql<number>`COUNT(*)`.as("deposit_count"),
        totalDeposited: sql<string>`SUM(amount)`.as("total_deposited"),
      }).from(transactions)
        .leftJoin(usersTable, eq(transactions.userId, usersTable.id))
        .where(sql`type = 'deposit' AND created_at > NOW() - INTERVAL '24 hours'`)
        .groupBy(transactions.userId, usersTable.name, usersTable.email)
        .having(sql`COUNT(*) >= 3`)
        .orderBy(sql`COUNT(*) DESC`);

      res.json({ highVolume, failedTxs, rapidDeposits });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/reset-wallets", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { confirmation } = req.body;
      if (confirmation !== "RESETAR_SALDOS") {
        return res.status(400).json({ message: "Confirmação inválida. Envie 'RESETAR_SALDOS' para confirmar." });
      }

      const { db: database } = await import("./db");
      const { users: usersTable, transactions } = await import("@shared/schema");
      const { sql } = await import("drizzle-orm");

      const [userCount] = await database.select({
        count: sql<number>`COUNT(*)`.as("count"),
        totalBalance: sql<string>`COALESCE(SUM(balance), 0)`.as("total_balance"),
      }).from(usersTable).where(sql`balance > 0 OR locked_balance > 0`);

      await database.execute(sql`UPDATE users SET balance = 0, locked_balance = 0`);

      await database.execute(sql`UPDATE transactions SET status = 'reset' WHERE status IN ('pending', 'processing')`);

      console.log(`[Admin] Wallets reset by admin. ${userCount.count} users affected, total balance cleared: ${userCount.totalBalance}`);

      res.json({
        message: "Todos os saldos foram zerados com sucesso",
        usersAffected: Number(userCount.count),
        totalCleared: Number(userCount.totalBalance),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ====== WEBHOOKS ======

  app.post("/api/webhooks/abacatepay", async (req, res) => {
    try {
      const { event, data } = req.body;

      console.log("[Webhook] Received:", event, data?.id);

      if (!event || !data) {
        return res.status(400).json({ message: "Payload inválido" });
      }

      let result;

      switch (event) {
        case "billing.paid":
        case "PAYMENT.RECEIVED":
          result = await webhookService.processPaymentConfirmed(data.id || data.billing?.id, data);
          break;
        case "withdraw.completed":
        case "withdraw.paid":
          result = await webhookService.processWithdrawCompleted(data.id, data);
          break;
        case "withdraw.failed":
          result = await webhookService.processWithdrawFailed(data.id, data);
          break;
        default:
          console.log("[Webhook] Evento não tratado:", event);
          result = { success: true, message: "Evento ignorado" };
      }

      res.json(result);
    } catch (error: any) {
      console.error("[Webhook] Error:", error.message);
      res.status(500).json({ message: "Erro ao processar webhook" });
    }
  });

  // ---- In-App Notifications + SSE ----

  app.get("/api/notifications/stream", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

    const heartbeat = setInterval(() => {
      try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
    }, 30000);

    notificationService.addSSEClient(userId, res);

    req.on("close", () => clearInterval(heartbeat));
  });

  app.get("/api/notifications", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const notifs = await storage.getNotifications(userId, 50);
    const unreadCount = await storage.getUnreadNotificationCount(userId);
    res.json({ notifications: notifs, unreadCount });
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const count = await storage.getUnreadNotificationCount(userId);
    res.json({ count });
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.markNotificationRead(req.params.id, userId);
    res.json({ success: true });
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.markAllNotificationsRead(userId);
    notificationService.sendSSE(userId, "unread-count", { unreadCount: 0 });
    res.json({ success: true });
  });

  // ---- Push Notifications ----

  app.get("/api/push/vapid-key", (_req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Não autenticado" });
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Dados de subscription inválidos" });
    }
    try {
      await storage.savePushSubscription({
        userId: req.session.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ message: "Endpoint obrigatório" });
    try {
      await storage.deletePushSubscription(endpoint);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/push/test", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Não autenticado" });
    try {
      const result = await pushService.sendToUser(req.session.userId, {
        title: "VYTAL",
        body: "Notificações ativadas com sucesso! 🎉",
        url: "/",
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
