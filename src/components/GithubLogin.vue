<template>
  <div>
    <v-btn v-if="!isLoggedIn" @click="githubLogin" color="primary white--text">
      <v-icon left>{{ ghIcon }}</v-icon
      >Iniciar Sesión
    </v-btn>
    <v-btn v-if="isLoggedIn" @click="githublogout" color="primary white--text">
      Cerrar Sesión
    </v-btn>
  </div>
</template>

<script>
import firebaseApp from "../FirebaseApp";
import firebase from "firebase/app";
import "firebase/auth";
import { mdiGithub } from "@mdi/js";

export default {
  data() {
    return {
      isLoggedIn: false,
      ghIcon: mdiGithub,
    };
  },
  created() {
    var user = firebaseApp.auth().currentUser;
    if (user) this.isLoggedIn = true;
    else this.isLoggedIn = false;
  },
  methods: {
    async githubLogin() {
      var provider = new firebase.auth.GithubAuthProvider();
      provider.addScope("repo");
      var result = null;
      await firebaseApp
        .auth()
        .signInWithPopup(provider)
        .then(function(result) {
          // This gives you a GitHub Access Token. You can use it to access the GitHub API.
          var token = result.credential.accessToken;
          // The signed-in user info.
          var user = result.user.displayName;
          localStorage.setItem("tokenId", token);
          localStorage.setItem("user", user);
        })
        .catch(function(error) {
          result = error;
        });
      if (!result) this.$router.go({ path: "estadisticas" });
      else {
        console.log("errorCode: ", result.code);
        console.log("errorMessage: ", result.message);
        // The email of the user's account used.
        console.log("email: ", result.email);
        // The firebase.auth.AuthCredential type that was used.
        console.log("credential: ", result.credential);
      }
    },
    githublogout() {
      var self = this;
      firebase
        .auth()
        .signOut()
        .then(function() {
          localStorage.setItem("tokenId", null);
          localStorage.setItem("user", null);
          self.isLoggedIn = false;
          self.$router.go({ path: "home" });
        })
        .catch(function(error) {
          self.$router.go({ path: "home" });
          console.log("errorCode: ", error.code);
          console.log("errorMessage: ", error.message);
        });
    },
  },
};
</script>
