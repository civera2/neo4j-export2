<template>
  <v-form>
      <v-row>
        <v-col class="py-0" cols="12" sm="3">
          <v-text-field v-model="protocol" label="Protocol"></v-text-field>
        </v-col>

        <v-col class="py-0" cols="12" sm="3">
          <v-text-field v-model="host" label="Host"></v-text-field>
        </v-col>

        <v-col class="py-0" cols="12" sm="3">
          <v-text-field v-model="port" label="Port"></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="py-0" cols="12" sm="4">
          <v-text-field v-model="username" label="Username"></v-text-field>
        </v-col>

        <v-col class="py-0" cols="12" sm="4">
          <v-text-field v-model="password" label="Password"></v-text-field>
        </v-col>

        <v-col class="py-0" cols="12" sm="4">
          <v-btn color="primary" v-on:click="connect()">
            <v-icon left>timeline</v-icon>Conectar</v-btn
          >
        </v-col>
        <v-col class="py-0" cols="12" sm="4">
          <v-btn color="primary" v-on:click="testQuery()">
            <v-icon left>timeline</v-icon>Probar</v-btn
          >
        </v-col>
      </v-row>
  </v-form>
</template>
 
<script>

export default {
  data() {
    return {
      protocol: "bolt",
      host: "localhost",
      port: 11005,
      username: "neo4j",
      password: "123",
    };
  },
  methods: {
    connect() {
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
    driver() {
      // Get a driver instance
      return this.$neo4j.getDriver();
    },
    testQuery() {
      // Get a session from the driver
      const session = this.$neo4j.getSession();
      const personName = 'Benji';
      const personName2 = 'Luna';
      // Or you can just call this.$neo4j.run(cypher, params)
      session
        //.run("Create (n:Producto{nombre:'Cris'}) return n")
        //.run('CREATE (a:Personas {name: $name}) RETURN a', {name: personName2})
        .run("Create (a:Personas{name:$name})-[:SE_CREAN]->(b:Personas{name:$name2})", {name: personName,name2:personName2})
        .then((res) => {
          //console.log(res.records[0].get("n.nombre"));
          console.log("Nodo creado",res);
        })
        .then(() => {
          session.close();
        });
    },
  },
};
</script>