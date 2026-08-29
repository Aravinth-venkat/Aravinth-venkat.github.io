(() => {
  const C = window.CAREERLAB_CONFIG || {};
  const PRODUCTION_AUTH_URL = "https://aravinth-venkat.github.io/auth.html";
  const PRODUCTION_HOME_URL = "https://aravinth-venkat.github.io/index.html";
  const COOLDOWN_SECONDS = 30;

  let supabaseClient = null;
  let signUp = false;
  let lastEmail = "";
  let timerId = null;

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);

  function msg(text, type = "") {
    const el = $("authMessage");
    if (!el) return;
    el.textContent = text || "";
    el.className = "auth-message" + (type ? ` ${type}` : "");
  }

  function configured() {
    return Boolean(C.SUPABASE_URL && C.SUPABASE_PUBLISHABLE_KEY && window.supabase?.createClient);
  }

  function getClient() {
    if (supabaseClient) return supabaseClient;
    if (!configured()) {
      msg("CareerLab account service is not configured yet. Add the Supabase URL and publishable key in app-config.js.", "error");
      return null;
    }
    try {
      supabaseClient = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_PUBLISHABLE_KEY);
      return supabaseClient;
    } catch (error) {
      console.error(error);
      msg("CareerLab could not connect to the account service. Check app-config.js.", "error");
      return null;
    }
  }

  function nextUrl() {
    const next = params.get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "index.html";
  }

  function setMode(mode) {
    signUp = mode === "signup";
    $("signInTab")?.classList.toggle("active", !signUp);
    $("signUpTab")?.classList.toggle("active", signUp);
    $("nameWrap")?.classList.toggle("hidden", !signUp);
    $("emailSubmit").textContent = signUp ? "Create account" : "Sign in";
    $("authPassword").autocomplete = signUp ? "new-password" : "current-password";
    $("authTitle").textContent = signUp ? "Create your CareerLab account" : "Continue your CareerLab journey";
    $("authIntro").textContent = signUp
      ? "Create your free account using email and password."
      : "Sign in to continue your CareerLab journey.";
    msg("");
  }

  function startCooldown(button, output) {
    clearInterval(timerId);
    let remaining = COOLDOWN_SECONDS;
    button.disabled = true;
    output.textContent = `You can resend in ${remaining}s.`;
    timerId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerId);
        button.disabled = false;
        output.textContent = "You can resend the confirmation email now.";
        return;
      }
      output.textContent = `You can resend in ${remaining}s.`;
    }, 1000);
  }

  async function sendConfirmationEmail() {
    const client = getClient();
    if (!client || !lastEmail) return;
    const { error } = await client.auth.resend({
      type: "signup",
      email: lastEmail,
      options: { emailRedirectTo: PRODUCTION_AUTH_URL }
    });
    if (error) {
      msg(error.message, "error");
      return;
    }
    msg("Confirmation email sent. Please check your inbox.", "ok");
    startCooldown($("resendBtn"), $("resendTimer"));
  }

  async function redirectIfAuthenticated() {
    if (params.get("mode") === "recovery") return;
    const client = getClient();
    if (!client) return;
    const { data } = await client.auth.getSession();
    if (data?.session) {
      window.location.replace(nextUrl());
    }
  }

  $("signInTab").onclick = () => setMode("signin");
  $("signUpTab").onclick = () => setMode("signup");
  $("resendBtn").onclick = sendConfirmationEmail;

  $("authForm").onsubmit = async event => {
    event.preventDefault();
    const client = getClient();
    if (!client) return;

    const email = $("authEmail").value.trim();
    const password = $("authPassword").value;
    const name = $("authName").value.trim();
    if (!email || !password) return msg("Enter your email and password.", "error");
    if (password.length < 8) return msg("Password must contain at least 8 characters.", "error");

    lastEmail = email;
    $("emailSubmit").disabled = true;
    $("emailSubmit").textContent = signUp ? "Creating account…" : "Signing in…";

    try {
      const result = signUp
        ? await client.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: name },
              emailRedirectTo: PRODUCTION_AUTH_URL
            }
          })
        : await client.auth.signInWithPassword({ email, password });

      if (result.error) {
        msg(result.error.message, "error");
        return;
      }

      if (signUp) {
        if (result.data?.session) {
          msg("Account created. Opening CareerLab…", "ok");
          setTimeout(() => window.location.replace(nextUrl()), 350);
          return;
        }
        $("confirmPanel").classList.remove("hidden");
        $("confirmText").textContent = `We sent a confirmation link to ${email}. Open it to activate your CareerLab account.`;
        startCooldown($("resendBtn"), $("resendTimer"));
        msg("Account created. Check your email to confirm your account.", "ok");
        return;
      }

      msg("Signed in successfully. Opening CareerLab…", "ok");
      setTimeout(() => window.location.replace(nextUrl()), 350);
    } finally {
      $("emailSubmit").disabled = false;
      $("emailSubmit").textContent = signUp ? "Create account" : "Sign in";
    }
  };

  $("forgotBtn").onclick = async () => {
    const client = getClient();
    if (!client) return;
    const email = $("authEmail").value.trim();
    if (!email) return msg("Enter your email first, then select Forgot password.", "error");

    $("forgotBtn").disabled = true;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${PRODUCTION_AUTH_URL}?mode=recovery`
    });
    if (error) {
      msg(error.message, "error");
      $("forgotBtn").disabled = false;
      return;
    }
    msg("Password reset link sent. Check your email.", "ok");
    let remaining = COOLDOWN_SECONDS;
    $("forgotBtn").textContent = `Try again in ${remaining}s`;
    const id = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(id);
        $("forgotBtn").disabled = false;
        $("forgotBtn").textContent = "Forgot password?";
      } else {
        $("forgotBtn").textContent = `Try again in ${remaining}s`;
      }
    }, 1000);
  };

  $("savePasswordBtn").onclick = async () => {
    const client = getClient();
    if (!client) return;
    const password = $("newPassword").value;
    if (password.length < 8) return msg("Use at least 8 characters.", "error");
    const { error } = await client.auth.updateUser({ password });
    if (error) return msg(error.message, "error");
    msg("Password updated successfully. Opening CareerLab…", "ok");
    setTimeout(() => window.location.replace("index.html"), 600);
  };

  function recovery() {
    if (params.get("mode") !== "recovery") return false;
    $("resetPanel").classList.remove("hidden");
    $("authForm").classList.add("hidden");
    $("authTabs").classList.add("hidden");
    $("forgotBtn").parentElement.classList.add("hidden");
    $("confirmPanel").classList.add("hidden");
    $("authTitle").textContent = "Create a new password";
    $("authIntro").textContent = "Choose a new password for your CareerLab account.";
    return true;
  }

  async function init() {
    setMode("signin");
    if (!recovery()) await redirectIfAuthenticated();
  }

  init();
})();
