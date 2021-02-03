<template>
  <v-card>
    <v-layout wrap class="pa-2">
      <v-flex xs4 sm1 md1>
        <v-avatar size="50" class="grey lighten-2">
          <img :src="avatarUrl" />
        </v-avatar>
      </v-flex>
      <v-flex xs4 sm2 md1>
        <div>{{ login }}</div>
        <div class="caption grey--text">Reactions: {{ reactCant }}</div>
      </v-flex>
      <v-flex xs4 sm2 md1>
        <div class="caption grey--text">Fecha</div>
        <div class="caption">{{ createdAt | moment }}</div>
      </v-flex>
      <v-flex xs12 sm7 md9>
        <div><span v-html="body"></span></div>
      </v-flex>
    </v-layout>
    <v-divider></v-divider>
  </v-card>
</template>

<script>
import moment from "moment";
moment.locale("es-us");

export default {
  props: ["avatarUrl", "login", "reactCant", "createdAt", "body"],
  filters: {
    moment: function(date) {
      //validar si es tipo fecha
      return moment(date).format("DD/MM/YY, h:mm:ss a");
    },
  },
};
</script>
