<template>
  <div id="inspire">
    <v-navigation-drawer
      v-if="isLoggedIn"
      app
      :clipped="$vuetify.breakpoint.lgAndUp"
      v-model="drawer"
    >
      <v-list dense>
        <template v-for="link in links">
          <v-layout v-if="link.heading" :key="link.heading" row align-center>
          </v-layout>
          <v-list-item v-else :key="link.text" router :to="link.route">
            <v-list-item-action>
              <v-icon>{{ link.icon }}</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ link.text }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      dark
      color="blue darken-3"
      :clipped-left="$vuetify.breakpoint.lgAndUp"
    >
      <v-app-bar-nav-icon
        v-if="isLoggedIn"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-toolbar-title class="headline text-uppercase">
        <span class="font-weight-bold">GIT</span>
        <span class="font-weight-light">ANA</span>
        <span class="body-2 font-weight-light"> Analíticas de Github</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-switch
        v-model="$vuetify.theme.dark"
        hide-details
        inset
        class="mx-4"
        label="Modo Oscuro"
      ></v-switch>
      <GithubLogin v-if="isLoggedIn" />
    </v-app-bar>
  </div>
</template>

<script>
import firebaseApp from "../FirebaseApp";
import GithubLogin from "./GithubLogin";

export default {
  components: {
    GithubLogin,
  },
  data() {
    return {
      protocol: "bolt",
      host: "localhost",
      port: 7687,
      username: "neo4j",
      password: "artsy2",
      dialog: false,
      drawer: null,
      isLoggedIn: false,
      links: [
        //{ icon: 'home', text: 'Inicio', route: '/' },
        { icon: "list_alt", text: "Pull Request", route: "/pullrequest" },
        { icon: "timeline", text: "Repositorio", route: "/repositorio" },
        { icon: "mdi-download", text: "RepoDescarga", route: "/repodescarga" },
        { icon: "timeline", text: "Neo4j Test", route: "/neo4j" },
        //{ icon: "person", text: "Participantes", route: "/userstats" },
        { icon: "help", text: "Acerca de", route: "/acerca" },
      ],
    };
  },
  created() {
    var user = firebaseApp.auth().currentUser;
    if (user) this.isLoggedIn = true;
    else this.isLoggedIn = false;
    return this.$neo4j
        .connect(
          this.protocol,
          this.host,
          this.port,
          this.username,
          this.password
        )
        .then((driver) => {
          // Update the context of your app
          console.log(driver);
        });
  },
  props: {
    source: String,
  },
};
</script>
