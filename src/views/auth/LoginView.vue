<script setup>
  import { ref, computed } from "vue";
  import { useRouter } from "vue-router";
  import { useTheme } from "vuetify";

  import { login, getAuthErrorMessage } from "@/services/authService";
  import { useAuthStore } from "@/stores/authStore";
  import { fetchTeamMemberByEmail } from "@/services/teamService";

  const router = useRouter();
  const authStore = useAuthStore();
  const theme = useTheme();

  const email = ref("");
  const password = ref("");
  const showPassword = ref(false);

  const isLoading = ref(false);
  const errorMessage = ref("");

  const isDark = computed(() => theme.global.name.value === "dark");

  function toggleTheme() {
    const next = isDark.value ? "light" : "dark";
    theme.global.name.value = next;
    localStorage.setItem("themeMode", next);
  }

  const features = [
    {
      icon: "mdi-chart-line",
      title: "Growth Tracking",
      desc: "Signups, activation and DAU trends at a glance",
      color: "primary",
    },
    {
      icon: "mdi-fire",
      title: "Retention Insights",
      desc: "Cohort retention and churn signals over time",
      color: "warning",
    },
    {
      icon: "mdi-lightning-bolt-outline",
      title: "Engagement Analytics",
      desc: "Folder visits, link opens and feature usage",
      color: "secondary",
    },
    {
      icon: "mdi-crown-outline",
      title: "Power Users",
      desc: "Spot your most active and pro subscribers",
      color: "brand-purple",
    },
  ];

  async function handleLogin() {
    errorMessage.value = "";

    if (!email.value || !password.value) {
      errorMessage.value =
        "Please enter your credentials";
      return;
    }

    try {
      isLoading.value = true;

      const user = await login(
        email.value,
        password.value
      );

      authStore.setUser(user);

      // Fetch team access before navigating so the route guard has teamMember
      const member = await fetchTeamMemberByEmail(user.email).catch(() => null)
      authStore.setTeamMember(member)

      router.push("/");
    } catch (error) {
      console.error(error);

      errorMessage.value =
        getAuthErrorMessage(error);
    } finally {
      isLoading.value = false;
    }
  }
</script>

<template>
  <v-container fluid class="fill-height pa-0 login-page">
    <v-btn
      :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
      variant="text"
      color="primary"
      class="theme-toggle"
      @click="toggleTheme"
    />

    <v-row no-gutters class="fill-height">
      <v-col md="7" class="hero-section">
        <div class="hero-glow hero-glow-1" />
        <div class="hero-glow hero-glow-2" />

        <div class="hero-content">
          <div class="hero-brand">
            <div class="brand-mark brand-mark--lg">
              <img src="@/assets/images/logo.png" />
            </div>

            <div>
              <div class="hero-brand-name">LinkBox</div>
              <div class="hero-brand-subtitle">Founder Dashboard</div>
            </div>
          </div>

          <div class="hero-tag">
            LinkBox Metrics
          </div>

          <h1>
            Understand growth before it happens.
          </h1>

          <p>
            Real-time insights into users,
            folders, links, engagement and
            platform health — everything you
            need to make better product decisions.
          </p>

          <div class="hero-features">
            <div v-for="feature in features" :key="feature.title" class="hero-feature">
              <v-avatar
                size="40"
                rounded="lg"
                class="hero-feature-icon"
                :color="`rgb(var(--v-theme-${feature.color}))`"
                variant="flat"
              >
                <v-icon :icon="feature.icon" size="20" color="white" />
              </v-avatar>

              <div>
                <div class="hero-feature-title">
                  {{ feature.title }}
                </div>

                <div class="hero-feature-desc">
                  {{ feature.desc }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="5" class="login-section">
        <v-card class="login-card" elevation="0">
          <div class="login-brand">
            <div class="brand-mark">
              <img src="@/assets/images/logo.png" />
            </div>

            <div>
              <div class="login-brand-name">
                LinkBox
              </div>

              <div class="login-brand-subtitle">
                Founder Dashboard
              </div>
            </div>
          </div>

          <div class="mb-8">
            <h2 class="text-h4 font-weight-bold">
              Welcome back
            </h2>

            <p class="login-subtitle mt-2">
              Sign in to access your dashboard
            </p>
          </div>

          <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <v-text-field
            v-model="email"
            label="Email"
            prepend-inner-icon="mdi-email-outline"
            autocomplete="username"
            class="mb-1"
            @keyup.enter="handleLogin"
          />

          <v-text-field
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            autocomplete="current-password"
            @click:append-inner="showPassword = !showPassword"
            @keyup.enter="handleLogin"
          />

          <v-btn block color="primary" size="large" class="mt-2" :loading="isLoading" @click="handleLogin">
            Sign In
            <v-icon end icon="mdi-arrow-right" />
          </v-btn>

          <div class="login-footer">
            <v-icon icon="mdi-shield-check-outline" size="14" class="mr-1" />
            Secure access for the LinkBox team
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  .login-page {
    position: relative;
    height: 100vh;
    overflow: hidden;
    background: rgb(var(--v-theme-background));
  }

  .theme-toggle {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
  }

  .hero-section {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 64px;
    background:
      linear-gradient(135deg, rgba(4, 20, 30, 0.45) 0%, rgba(10, 15, 50, 0.55) 100%),
      linear-gradient(135deg,
        rgb(var(--v-theme-primary)) 0%,
        rgb(var(--v-theme-secondary)) 100%);
  }

  .hero-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.45;
    pointer-events: none;
  }

  .hero-glow-1 {
    width: 380px;
    height: 380px;

    top: -120px;
    right: -100px;

    background: rgb(var(--v-theme-brand-purple));
  }

  .hero-glow-2 {
    width: 340px;
    height: 340px;

    bottom: -140px;
    left: -80px;

    background: rgb(var(--v-theme-warning));
    opacity: 0.3;
  }

  .hero-content {
    position: relative;
    z-index: 1;

    width: 100%;
    max-width: 520px;

    color: #FFFFFF;
  }

  .hero-brand {
    display: flex;
    align-items: center;
    gap: 14px;

    margin-bottom: 40px;
  }

  .brand-mark {
    flex-shrink: 0;

    width: 48px;
    height: 48px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 14px;
    overflow: hidden;

    background: #FFFFFF;
  }

  .brand-mark--lg {
    width: 52px;
    height: 52px;
  }

  .brand-mark img {
    width: 160%;
    height: 160%;
    object-fit: contain;
  }

  .hero-brand-name {
    font-size: 18px;
    font-weight: 800;
  }

  .hero-brand-subtitle {
    font-size: 12px;
    font-weight: 600;

    color: rgba(255, 255, 255, 0.75);
  }

  .hero-tag {
    display: inline-flex;

    padding: 6px 14px;

    border-radius: 999px;

    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.24);

    color: #FFFFFF;

    font-size: 12px;
    font-weight: 700;

    text-transform: uppercase;
    letter-spacing: 0.08em;

    margin-bottom: 20px;
  }

  .hero-content h1 {
    font-size: 2.75rem;
    line-height: 1.15;
    font-weight: 800;

    margin-bottom: 16px;
  }

  .hero-content p {
    font-size: 1rem;
    line-height: 1.7;

    max-width: 440px;

    color: rgba(255, 255, 255, 0.85);

    margin-bottom: 36px;
  }

  .hero-features {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .hero-feature {
    display: flex;
    align-items: center;
    gap: 14px;

    padding: 14px 16px;

    border-radius: 16px;

    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);

    backdrop-filter: blur(6px);
  }

  .hero-feature-icon {
    flex-shrink: 0;
    box-shadow: none;
  }

  .hero-feature-title {
    font-size: 14px;
    font-weight: 700;
  }

  .hero-feature-desc {
    font-size: 12px;

    color: rgba(255, 255, 255, 0.75);

    margin-top: 2px;
  }

  .login-section {
    display: flex;
    align-items: center;
    justify-content: center;

    background: rgb(var(--v-theme-background));
    padding: 40px;
  }

  .login-card {
    width: 100%;
    max-width: 440px;

    padding: 40px;

    border-radius: 24px;

    background: rgb(var(--v-theme-surface-bright));

    border: 1px solid rgb(var(--v-theme-outline));

    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  }

  .login-brand {
    display: flex;
    align-items: center;
    gap: 16px;

    margin-bottom: 32px;
  }

  .login-brand-name {
    font-size: 22px;
    font-weight: 800;

    color: rgb(var(--v-theme-on-surface));
  }

  .login-brand-subtitle {
    font-size: 13px;
    font-weight: 600;

    color: rgb(var(--v-theme-text-tertiary));
  }

  .login-card h2 {
    color: rgb(var(--v-theme-on-surface));
  }

  .login-subtitle {
    font-size: 14px;
    color: rgb(var(--v-theme-text-tertiary));
  }

  .login-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    margin-top: 28px;

    font-size: 12px;
    font-weight: 600;

    color: rgb(var(--v-theme-text-tertiary));
  }

  @media (max-width: 1280px) {
    .hero-section {
      padding: 40px;
    }

    .hero-content h1 {
      font-size: 2.25rem;
    }
  }

  @media (max-width: 960px) {
    .hero-section {
      display: none;
    }

    .login-section {
      padding: 24px;
    }

    .login-card {
      max-width: 100%;
      padding: 28px;
    }
  }
</style>
