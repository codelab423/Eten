// Logica voor index.html (inloggen / account aanmaken)

const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const meldingEl = document.getElementById("auth-melding");

function toonMelding(tekst, isFout = true) {
  meldingEl.textContent = tekst;
  meldingEl.hidden = false;
  meldingEl.classList.toggle("melding-fout", isFout);
  meldingEl.classList.toggle("melding-ok", !isFout);
}

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("actief");
  tabSignup.classList.remove("actief");
  loginForm.hidden = false;
  signupForm.hidden = true;
  meldingEl.hidden = true;
});

tabSignup.addEventListener("click", () => {
  tabSignup.classList.add("actief");
  tabLogin.classList.remove("actief");
  signupForm.hidden = false;
  loginForm.hidden = true;
  meldingEl.hidden = true;
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    toonMelding("Inloggen mislukt: " + error.message);
    return;
  }
  window.location.href = "app.html";
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const naam = document.getElementById("signup-naam").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { naam } },
  });

  if (error) {
    toonMelding("Account aanmaken mislukt: " + error.message);
    return;
  }

  if (data.session) {
    // Meteen ingelogd (e-mailbevestiging staat uit in het Supabase-project)
    window.location.href = "app.html";
  } else {
    toonMelding(
      "Account aangemaakt! Check je e-mail om je account te bevestigen en log daarna in.",
      false
    );
  }
});

// Als je al ingelogd bent, meteen doorsturen naar de app
(async () => {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    window.location.href = "app.html";
  }
})();
