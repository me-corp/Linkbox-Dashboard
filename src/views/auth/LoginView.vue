<script setup>
  import { ref } from "vue";
  import { useRouter } from "vue-router";

  import { login } from "@/services/authService";
  import { useAuthStore } from "@/stores/authStore";

  const router = useRouter();
  const authStore = useAuthStore();

  const email = ref("");
  const password = ref("");

  const isLoading = ref(false);
  const errorMessage = ref("");

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

      if (!user) {
        errorMessage.value =
          "Invalid credentials";
        return;
      }

      authStore.login(user);

      router.push("/");
    } catch (error) {
      console.error(error);

      errorMessage.value =
        "Unable to sign in";
    } finally {
      isLoading.value = false;
    }
  }
</script>

<template>
  <v-container fluid class="fill-height pa-0 login-page">
    <v-row no-gutters class="fill-height">
      <v-col md="7" class="showcase-section">
        <div class="showcase-content">
          <div class="brand-tag">
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

          <div class="founder-principles">
            <div class="principle">
              User Analytics
            </div>

            <div class="principle">
              Folder Insights
            </div>

            <div class="principle">
              Growth Tracking
            </div>

            <div class="principle">
              Platform Health
            </div>
          </div>

          <div class="screenshots">
            <img src="@/assets/images/app_home.png" class="shot shot-1" />

            <img src="@/assets/images/folder_screen.png" class="shot shot-2" />

            <img src="@/assets/images/insight_Screen.png" class="shot shot-3" />
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="5" class="login-section">
        <v-card class="login-card" elevation="0">
          <div class="login-brand">
            <img src="@/assets/images/logo.png" class="login-logo" />

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
            <h2 class="text-h3 font-weight-bold">
              Welcome Back
            </h2>

            <p class="text-medium-emphasis mt-2">
              Sign in to continue
            </p>
          </div>

          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <v-text-field v-model="email" label="Email" variant="outlined" prepend-inner-icon="mdi-email-outline"
            @keyup.enter="handleLogin" />

          <v-text-field v-model="password" label="Password" type="password" variant="outlined"
            prepend-inner-icon="mdi-lock-outline" @keyup.enter="handleLogin" />

          <v-btn block color="primary" size="large" class="mt-4" :loading="isLoading" @click="handleLogin">
            Sign In
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<style scoped>
  .login-page {
    height: 100vh;
    overflow: hidden;
    background: #f8fafc;
  }

  .showcase-section {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: linear-gradient(180deg,
        #f8fafc 0%,
        #eef2ff 100%);
  }

  .showcase-content {
    width: 100%;
    height: 100%;
    max-width: 650px;
  }

  .brand-tag {
    display: inline-flex;

    padding: 8px 16px;

    border-radius: 999px;

    background: #eef2ff;

    color: #4f46e5;

    font-size: 13px;
    font-weight: 700;

    text-transform: uppercase;
    letter-spacing: 0.08em;

    margin-bottom: 20px;
  }

  .showcase-content h1 {
    font-size: 3rem;
    line-height: 1.05;
    font-weight: 800;

    color: #0f172a;

    margin-bottom: 16px;
  }

  .showcase-content p {
    font-size: 1.05rem;
    line-height: 1.7;

    color: #64748b;

    margin-bottom: 24px;
  }

  .founder-principles {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    margin-bottom: 24px;
  }

  .principle {
    padding: 10px 16px;

    background: white;

    border-radius: 12px;
    border: 1px solid #e2e8f0;

    font-size: 14px;
    font-weight: 600;

    color: #475569;
  }

  .screenshots {
    position: relative;
    height: 320px;
  }

  .shot {
    position: absolute;

    border-radius: 24px;

    box-shadow:
      0 20px 50px rgba(15, 23, 42, 0.12);
  }

  .shot-1 {
    width: 170px;

    left: 0;
    top: 60px;

    transform: rotate(-5deg);
  }

  .shot-2 {
    width: 210px;

    left: 120px;
    top: 0;

    z-index: 2;
  }

  .shot-3 {
    width: 170px;

    left: 280px;
    top: 60px;

    transform: rotate(5deg);
  }

  .login-section {
    display: flex;
    align-items: center;
    justify-content: center;

    background: white;
    padding: 40px;
  }

  .login-card {
    width: 100%;
    max-width: 460px;

    padding: 40px;

    border-radius: 28px;

    background: white;

    border: 1px solid #e2e8f0;

    box-shadow:
      0 25px 70px rgba(15, 23, 42, 0.08);
  }

  .login-brand {
    display: flex;
    align-items: center;
    gap: 16px;

    margin-bottom: 40px;
  }

  .login-logo {
    height: 64px;
  }

  .login-brand-name {
    font-size: 28px;
    font-weight: 800;

    color: #0f172a;
  }

  .login-brand-subtitle {
    color: #64748b;

    font-size: 14px;
    font-weight: 600;
  }

  .login-card h2 {
    color: #0f172a;
  }

  @media (max-width: 960px) {
    .showcase-section {
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