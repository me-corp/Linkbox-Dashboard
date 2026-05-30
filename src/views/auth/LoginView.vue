<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import { login } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");

async function handleLogin() {
  const user = await login(
    email.value,
    password.value
  );

  if (!user) {
    alert("Invalid Credentials");
    return;
  }

  authStore.login(user);

  router.push("/");
}
</script>

<template>
  <div>
    <h1>Login</h1>

    <input
      v-model="email"
      placeholder="Email"
    />

    <br />
    <br />

    <input
      v-model="password"
      type="password"
      placeholder="Password"
    />

    <br />
    <br />

    <button @click="handleLogin">
      Login
    </button>
  </div>
</template>