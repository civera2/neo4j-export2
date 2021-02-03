<template>
  <div>
    <h1 class="subheading-1 blue--text">Estadísticas de Usuario</h1>
    <v-form>
      <!--<v-select
        v-model="name" :items="users" label="Usuario" v-on:change='refreshQuery'
      ></v-select>-->
      <v-text-field v-model="name" label="Usuario"></v-text-field>
      <v-btn v-on:click="refreshQuery" color="primary" class="mb-4"
        >Buscar</v-btn
      >
    </v-form>
    <v-progress-linear
      v-if="$apollo.loading"
      indeterminate
      color="primary"
    ></v-progress-linear>
    <v-divider class="mb-2"></v-divider>
    <h1 v-if="show" class="headline grey--text">
      <a class="subheading" target="_blank" :href="user.url">
        {{ user.url }}
      </a>
    </h1>
    <div v-if="show">
      <v-data-table
        :headers="encabezados"
        :items="estadisticas"
        :items-per-page="20"
        class="elevation-1 mt-2"
      ></v-data-table>
    </div>
  </div>
</template>

<script>
import { USER_STATS, USER } from "../graphql/queries.js";

export default {
  data() {
    return {
      show: false,
      encabezados: [
        { text: "usuario", sortable: false, value: "nombre" },
        { text: "Watchers", value: "watch" },
        { text: "Stars", value: "star" },
        { text: "Forks", value: "fork" },
        { text: "Seguidores", value: "followers" },
        { text: "Siguiendo", value: "following" },
      ],
      estadisticas: "",
      repositoryOwner: "",
      user: "",
      name: "",
      users: [
        "nhooyr",
        "frol",
        "nol166",
        "kylecarbs",
        "sr229",
        "code-asher",
        "stevesloka",
        "NGTmeaty",
        "bhack",
        "PhilsLab",
        "Zate",
        "lucacasonato",
        "webbertakken",
        "andreimc",
        "avelino",
        "MichaelDesantis",
        "zerdos",
        "aslafy-z",
        "lsmoura",
        "Omeryl",
        "mko-x",
        "sabrehagen",
        "coadler",
        "davefinster",
        "ammario",
        "visualphoenix",
        "TomFrost",
        "foresthoffman",
        "satlus",
        "ibnesayeed",
        "ptoulouse",
      ],
    };
  },
  apollo: {
    repositoryOwner: {
      query: USER_STATS,
      variables: { owner: "flacket" },
    },
    user: {
      query: USER,
      variables: { owner: "flacket" },
    },
  },
  mounted: function() {
    this.$apollo.skipAll = true;
  },
  methods: {
    listarTodos() {
      if (!this.$apollo.skipAll) {
        this.$apollo.skipAll = false;
      }
      var estadisticas = "";
      this.users.forEach((item) => {
        var watch, star, fork, followers, following;
        this.$apollo.queries.repositoryOwner
          .refetch({ owner: item })
          .then(() => {
            watch = 0;
            star = 0;
            fork = 0;
            //cuenta las estadisticas de los repositorios
            this.repositoryOwner.repositories.nodes.forEach(function(element) {
              watch += element.watchers.totalCount;
              star += element.stargazers.totalCount;
              fork += element.forkCount;
            });

            this.$apollo.queries.user.refetch({ owner: item }).then(() => {
              followers = this.user.followers.totalCount;
              following = this.user.following.totalCount;

              //guardo las stats en un JSON
              if (estadisticas == "") {
                estadisticas = "[";
              } else {
                estadisticas = estadisticas.slice(0, -1);
                estadisticas += ",";
              }
              estadisticas +=
                '{"nombre": "' +
                item +
                '", "watch": ' +
                watch +
                ', "star": ' +
                star +
                ', "fork": ' +
                fork +
                ', "followers": ' +
                followers +
                ', "following": ' +
                following +
                "}]";
              var parser = estadisticas;
              this.estadisticas = JSON.parse(parser);
              console.log(this.estadisticas);
              this.show = true;
            });
          });
      });
    },
    refreshQuery() {
      if (!this.$apollo.skipAll) {
        this.$apollo.skipAll = false;
      }
      this.$apollo.queries.repositoryOwner
        .refetch({ owner: this.name })
        .then(() => {
          var watch, star, fork, followers, following;
          watch = 0;
          star = 0;
          fork = 0;

          //cuenta las estadisticas de los repositorios
          this.repositoryOwner.repositories.nodes.forEach(function(element) {
            watch += element.watchers.totalCount;
            star += element.stargazers.totalCount;
            fork += element.forkCount;
          });

          this.$apollo.queries.user.refetch({ owner: this.name }).then(() => {
            followers = this.user.followers.totalCount;
            following = this.user.following.totalCount;
            //guardo las stats en un JSON
            var estadisticas =
              '[{"nombre": "' +
              this.name +
              '", "watch": ' +
              watch +
              ', "star": ' +
              star +
              ', "fork": ' +
              fork +
              ', "followers": ' +
              followers +
              ', "following": ' +
              following +
              "}]";
            this.estadisticas = JSON.parse(estadisticas);
            this.show = true;
          });
        });
    }, //refresh query
  },
};
</script>
