<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-content :class="`project ${project.isPrivate}`">
        <v-layout slot="header" wrap class="pr-2">
          <v-flex xs12 md6>
            <div class="caption grey--text">Titulo Proyecto</div>
            <div>{{ project.name }}</div>
          </v-flex>
          <v-flex xs6 sm4 md2>
            <div class="caption grey--text">Persona</div>
            <div>{{ project.nameWithOwner }}</div>
          </v-flex>
          <v-flex xs6 sm4 md2>
            <div class="caption grey--text">Fecha Creación</div>
            <div>{{ project.createdAt }}</div>
          </v-flex>
          <v-flex xs2 sm4 md2>
            <div class="float-right">
              <v-chip
                small
                :class="`${project.isPrivate} white--text my-2 caption`"
                >{{ project.isPrivate }}</v-chip
              >
            </div>
          </v-flex>
        </v-layout>
        <v-card>
          <v-card-text class="px-3 grey--text">
            <div>{{ project.description }}</div>
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>

  <!--<v-card flat>
        <v-layout row wrap :class="`pa-3 project ${project.status}`">
          <v-flex xs12 md6>
            <div class="caption grey--text">Titulo Proyecto</div>
            <div>{{ project.title }}</div>
          </v-flex>
          <v-flex xs6 sm4 md2>
            <div class="caption grey--text">Persona</div>
            <div>{{ project.person }}</div>
          </v-flex>
          <v-flex xs6 sm4 md2>
            <div class="caption grey--text">Fecha Creación</div>
            <div>{{ project.due }}</div>
          </v-flex>
          <v-flex xs2 sm4 md2>
            <div class="right">
              <v-chip small :class="`${project.status} white--text my-2 caption`">{{ project.status }}</v-chip>
            </div>
          </v-flex>
        </v-layout>
    </v-card>-->
</template>

<script>
export default {
  props: ["project"],
};
</script>

<style>
.project.complete {
  border-left: 4px solid #3cd1c2;
}
.project.ongoing {
  border-left: 4px solid orange;
}
.project.overdue {
  border-left: 4px solid tomato;
}
.v-chip.complete {
  background: #3cd1c2;
}
.v-chip.ongoing {
  background: orange;
}
.v-chip.overdue {
  background: tomato;
}
</style>
