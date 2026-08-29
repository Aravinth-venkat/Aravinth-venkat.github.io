(() => {
  const C = window.CAREERLAB_CONFIG || {};
  let supabaseClient = null;
  let signUp = false;
  let phoneMode = false;

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
      msg("CareerLab account sign-in is not connected yet. Add the Supabase URL and publishable key in app-config.js, then enable the providers in Supabase.", "error");
      return null;
    }
    try {
      supabaseClient = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_PUBLISHABLE_KEY);
      return supabaseClient;
    } catch (error) {
      msg("CareerLab could not connect to the account service. Please check app-config.js.", "error");
      console.error(error);
      return null;
    }
  }

  function nextUrl() {
    const next = params.get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "index.html";
  }

  function setMode(mode) {
    signUp = mode === "signup";
    phoneMode = mode === "phone";
    ["signInTab", "signUpTab", "phoneTab"].forEach(id => $(id)?.classList.remove("active"));
    $(mode === "signup" ? "signUpTab" : mode === "phone" ? "phoneTab" : "signInTab")?.classList.add("active");

    $("authForm")?.classList.toggle("hidden", phoneMode);
    $("phonePanel")?.classList.toggle("hidden", !phoneMode);
    $("nameWrap")?.classList.toggle("hidden", !signUp);
    $("emailSubmit").textContent = signUp ? "Create account" : "Sign in";
    $("authPassword").autocomplete = signUp ? "new-password" : "current-password";
    $("authTitle").textContent = signUp ? "Create your CareerLab account" : "Continue your CareerLab journey";
    $("authIntro").textContent = signUp
      ? "Create a free account to save progress and continue your CareerLab journey."
      : phoneMode
        ? "Use your phone number to securely sign in to CareerLab."
        : "Sign in to save your progress, continue after visitor limits and unlock features your account is eligible for.";
    msg("");
  }

  async function oauth(provider) {
    const client = getClient();
    if (!client) return;
    msg(`Connecting to ${provider === "azure" ? "Microsoft" : provider[0].toUpperCase() + provider.slice(1)}…`);
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}${location.pathname.replace(/auth\.html$/, "index.html")}` }
    });
    if (error) msg(error.message, "error");
  }

  $("signInTab").onclick = () => setMode("signin");
  $("signUpTab").onclick = () => setMode("signup");
  $("phoneTab").onclick = () => setMode("phone");

  $("authForm").onsubmit = async event => {
    event.preventDefault();
    const client = getClient();
    if (!client) return;

    const email = $("authEmail").value.trim();
    const password = $("authPassword").value;
    const name = $("authName").value.trim();
    if (!email || !password) return msg("Enter your email and password.", "error");
    if (password.length < 8) return msg("Password must contain at least 8 characters.", "error");

    $("emailSubmit").disabled = true;
    $("emailSubmit").textContent = signUp ? "Creating account…" : "Signing in…";
    try {
      const result = signUp
        ? await client.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: `${location.origin}/index.html` } })
        : await client.auth.signInWithPassword({ email, password });

      if (result.error) return msg(result.error.message, "error");
      if (signUp && !result.data.session) return msg("Account created. Check your email to confirm your CareerLab account.", "ok");
      msg("Signed in successfully. Opening CareerLab…", "ok");
      setTimeout(() => { location.href = nextUrl(); }, 350);
    } finally {
      $("emailSubmit").disabled = false;
      $("emailSubmit").textContent = signUp ? "Create account" : "Sign in";
    }
  };

  $("sendOtpBtn").onclick = async () => {
    const client = getClient();
    if (!client) return;
    const phone = $("phoneNumber").value.trim();
    if (!phone) return msg("Enter your phone number with country code.", "error");
    $("sendOtpBtn").disabled = true;
    try {
      const { error } = await client.auth.signInWithOtp({ phone });
      if (error) return msg(error.message, "error");
      $("otpWrap").classList.remove("hidden");
      msg("OTP sent. Enter the code you received on your phone.", "ok");
    } finally { $("sendOtpBtn").disabled = false; }
  };

  $("verifyOtpBtn").onclick = async () => {
    const client = getClient();
    if (!client) return;
    const phone = $("phoneNumber").value.trim();
    const token = $("phoneOtp").value.trim();
    if (!phone || token.length !== 6) return msg("Enter the 6-digit OTP.", "error");
    const { data, error } = await client.auth.verifyOtp({ phone, token, type: "sms" });
    if (error) return msg(error.message, "error");
    if (data.session) { msg("Phone verified. Opening CareerLab…", "ok"); setTimeout(() => location.href = nextUrl(), 350); }
  };

  $("forgotBtn").onclick = async () => {
    const client = getClient();
    if (!client) return;
    const email = $("authEmail").value.trim();
    if (!email) return msg("Enter your email first, then select Forgot password.", "error");
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth.html?mode=recovery` });
    msg(error ? error.message : "Password reset link sent. Check your email.", error ? "error" : "ok");
  };

  $("googleBtn").onclick = () => oauth("google");
  $("githubBtn").onclick = () => oauth("github");
  $("microsoftBtn").onclick = () => oauth("azure");

  $("magicBtn").onclick = async () => {
    const client = getClient();
    if (!client) return;
    const email = $("authEmail").value.trim();
    if (!email) return msg("Enter your email first.", "error");
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/index.html` } });
    msg(error ? error.message : "Magic link sent. Check your email.", error ? "error" : "ok");
  };

  $("savePasswordBtn").onclick = async () => {
    const client = getClient();
    if (!client) return;
    const password = $("newPassword").value;
    if (password.length < 8) return msg("Use at least 8 characters.", "error");
    const { error } = await client.auth.updateUser({ password });
    if (error) return msg(error.message, "error");
    msg("Password updated successfully. You can now continue to CareerLab.", "ok");
    setTimeout(() => location.href = "index.html", 600);
  };

  function recovery() {
    if (params.get("mode") !== "recovery") return;
    $("resetPanel").classList.remove("hidden");
    $("authTitle").textContent = "Create a new password";
    $("authIntro").textContent = "Choose a new password for your CareerLab account.";
    $("authForm").classList.add("hidden");
    $("phonePanel").classList.add("hidden");
    $("forgotBtn").parentElement.classList.add("hidden");
  }

  setMode("signin");
  recovery();
})();
