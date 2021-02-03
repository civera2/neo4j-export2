<template>
  <v-container>
    <v-layout text-center wrap>
      <v-flex xs12>
        <v-img
          :src="require('../assets/logo.png')"
          class="my-3"
          contain
          height="200"
        ></v-img>
      </v-flex>

      <v-flex mb-4>
        <h1 class="display-2 font-weight-bold">
          GIT<span class="font-weight-light">ANA</span>
        </h1>
        <h2 class="mb-3">
          <span class="font-weight-light">Analíticas de Github</span>
        </h2>
        <p class="subheading font-weight-regular">
          Webapp en desarrollo para analisis de sentimientos en equipos de
          trabajo distribuidos
        </p>
        <p class="subheading font-weight-regular">
          Inicia Sesion en Github para comenzar
        </p>
        <GithubLogin />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import GithubLogin from "../components/GithubLogin";

export default {
  components: {
    GithubLogin,
  },
};
</script>
