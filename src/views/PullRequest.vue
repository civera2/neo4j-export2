<template>
  <div>
    <v-snackbar
      right
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
    >
      {{ snackbar.text }}
      <v-btn dark text @click="snackbar.show = false">Close</v-btn>
    </v-snackbar>
    <h1 class="subheading-1 blue--text">Pull Request</h1>
    <PRSelector
      v-on:search-pr="refreshQuery"
      v-bind:hideNumber="false"
    ></PRSelector>
    <v-progress-linear
      v-if="$apollo.loading"
      indeterminate
      color="primary"
    ></v-progress-linear>
    <v-divider class="mb-2"></v-divider>
    <!--/////////////////////////////////////////////////////-->
    <div v-if="show">
      <h1 class="headline grey--text">
        {{ repository.pullRequest.title }}
        <a
          class="subheading"
          target="_blank"
          :href="repository.pullRequest.url"
        >
          #{{ repository.pullRequest.number }}
        </a>
      </h1>
      <v-container>
        <v-card pa-2 outlined>
          <h4>Metricas Grupales del Pull Request</h4>
          <v-row>
            <v-col sm="12" md="3">
              <v-layout column>
                <v-flex>
                  <p>
                    Participantes:
                    {{ this.repository.pullRequest.participants.totalCount }}
                  </p>
                </v-flex>
                <v-flex>
                  <p>
                    Tamaño PR (loc):
                    {{
                      this.repository.pullRequest.additions +
                        this.repository.pullRequest.deletions
                    }}
                  </p>
                </v-flex>
                <v-flex>
                  <p>Estado: {{ this.repository.pullRequest.state }}</p>
                </v-flex>
              </v-layout>
            </v-col>
            <v-col class="mb-3" sm="2">
              <h4>Cohesión:</h4>
              <Doughnut :chartData="chartCoheGrupal" />
            </v-col>
            <v-col class="mb-3" sm="2">
              <h4>Colaboración:</h4>
              <Doughnut :chartData="chartColabGrupal" />
            </v-col>
            <v-col class="mb-3" sm="2">
              <h4>Mímica:</h4>
              <Doughnut :chartData="chartMimicaGrupal" />
            </v-col>
            <v-col class="mb-3" sm="2">
              <h4>Polaridad:</h4>
              <Doughnut :chartData="chartTonoGrupal" />
            </v-col>
          </v-row>
        </v-card>
        <v-row>
          <v-col sm="12" md="5">
            <h4>Cohesión Individual:</h4>
            <BarChart :chartData="chartCohe" />
          </v-col>
          <v-col sm="12" md="5">
            <h4>Colaboración Individual:</h4>
            <BarChart :chartData="chartColab" />
          </v-col>
          <!--<v-col sm="12" md="5">
            <h4>Mimica:</h4>
            <v-select
              @change="chartDataMimica"
              v-model="participante"
              :items="participantes"
              label="Participante"
              item-text="nombre"
              item-value="pos"
              return-object
              dense
              :hint="`${participante.nombre}, ${participante.pos}`"
            ></v-select>
            <RadarChart :chartData="chartMimica" />
          </v-col>-->
        </v-row>
        <v-row>
          <v-col sm="12" md="12">
            <h4>Estadísticas de Participantes:</h4>
            <v-data-table
              hide-default-footer
              :headers="encabezados"
              :items="estadisticas"
              :items-per-page="20"
              class="elevation-1 mt-2"
            ></v-data-table>
          </v-col>
        </v-row>
        <v-btn class="ma-2" color="primary" v-on:click="csvExport()">
          <v-icon left>mdi-file-table</v-icon>Exportar Chat</v-btn
        >
      </v-container>
    </div>
  </div>
</template>

<script>
import PRSelector from "../components/PRSelector";
//import RadarChart from "../components/chartjs/RadarChart.vue";
import BarChart from "../components/chartjs/BarChart.vue";
import Doughnut from "../components/chartjs/Doughnut.vue";
import { GET_REPO } from "../graphql/queries.js";
import {
  matrizConteoPR,
  cohesionFormula,
  colaboracionFormula,
  comunaFormula,
  mimicaFormula,
  polaridadFormula,
  getPRChat,
} from "../formulas.js";

export default {
  components: {
    PRSelector,
    //RadarChart,
    BarChart,
    Doughnut,
  },
  data() {
    return {
      show: false,
      countMatrix: "",
      cohesionMatrix: "",
      colabMatrix: "",
      comunaMatrix: "",
      mimicaMatrix: "",
      repository: "",
      chat: "",
      snackbar: {
        show: false,
        text: "Bienvenido a Gitana: Analíticas de Github",
        color: "info",
        timeout: 2500,
      },
      chartCoheGrupal: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: ["rgba(0, 71, 255, 1)", "rgba(0, 71, 255, 0.2)"],
          },
        ],
      },
      chartColabGrupal: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: ["rgba(0, 71, 255, 1)", "rgba(0, 71, 255, 0.2)"],
          },
        ],
      },
      chartMimicaGrupal: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: ["rgba(0, 71, 255, 1)", "rgba(0, 71, 255, 0.2)"],
          },
        ],
      },
      chartTonoGrupal: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: ["rgba(0, 71, 255, 1)", "rgba(0, 71, 255, 0.2)"],
          },
        ],
      },
      chartCohe: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: "rgba(0, 71, 255, 1)",
          },
        ],
      },
      chartColab: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: "rgba(0, 71, 255, 1)",
          },
        ],
      },
      participante: {},
      participantes: [],
      chartMimica: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: "rgba(0, 71, 255, 0.5)",
          },
        ],
      },
      estadisticas: [],
      saltarPR: false,
      encabezados: [
        { text: "Participante", sortable: false, value: "nombre" },
        { text: "Interacciones Enviadas", value: "msjEnviados" },
        { text: "Interacciones Recibidas", value: "msjRecibidos" },
        { text: "Mímica", value: "mimicaInd" },
        { text: "Polaridad", value: "tonoInd" },
      ],
      cohesionGrupal: "",
      getComuna: "",
      ListaMatrix: [],
    };
  },
  apollo: {
    repository: {
      query: GET_REPO,
      variables: { owner: "flacket", name: "githubanalytic", number: 150 },
    },
  },
  mounted: function() {
    this.$apollo.skipAll = true;
    
  },
  methods: {
    showSnackbar(text, color, timeout) {
      this.snackbar.text = text;
      this.snackbar.color = color;
      this.snackbar.timeout = timeout;
      this.snackbar.show = true;
    },
    exportarNeo4j() {
      //const session = this.$neo4j.getSession();
     // var matriz = this.countMatrix;

     // var participantes = this.repository.pullRequest.participants;
     // var cantPersonas = this.repository.pullRequest.participants.totalCount;
      var prid= this.repository.pullRequest.id;
      var url= this.repository.pullRequest.url;

      //let participantes = new Array();
      /*this.repository.pullRequest.participants.nodes.forEach(function(element) {
      participantes.push(element.login);
       //participants.push(element.id);
       });*/
      //console.log("matriz",this.countMatrix);
       
       //const personName = 'Benji';
      this.ListaMatrix.forEach(item => {
      const session = this.$neo4j.getSession();
      console.log("emisor", item.emisor);
            session
              /*.run(
                "Create (a:Participante{id:$name})-[:INTERACTUA]->(b:Participante{id:$name2})",{ name: emisor, name2: receptor }
              )*/
              //.run("Create (n:Persona{nombre:$name}) return n",{name:item.id})
              //.run("CREATE (a:Personas {name: $name}) RETURN a", {name:item.emisor})
              //.run("Create (a:Personas{name:$name})-[:SE_CREAN]->(b:Personas{name:$name2})", {name: personName,name2:item.emisor})
              .run("OPTIONAL MATCH (a:Desarrollador),(b:Desarrollador) WHERE a.id = $name AND   b.id=$name2 CREATE (a)-[r:INTERACTUA{id:$prid,url:$url,fecha:$fecha,hora:$hora}]->(b) RETURN a,b", { name: item.emisor, name2: item.receptor,prid: prid,url: url,fecha: item.fecha,hora: item.hora})
             .then((res) => {
                //console.log(res.records[0].get("n.nombre"));
                console.log("Nodo creado", res);
              })
              //.then(() => {
              //  session.close();
              //});

      })
/*      for (let i = 0; i < cantPersonas; i++) {
        var emisor = participantes.nodes[i].login;
        for (let j = 0; j < cantPersonas; j++) {
          
          var receptor = participantes.nodes[j].login;
          //console.log("matriz",matriz[i][j],"emisor",emisor,"receptor",receptor);
          for (let k = 0; k < matriz[i][j]; k++) {
            //var emisor = participantes.nodes[i].login;
            //var receptor = participantes.nodes[j].login;
            if(matriz[i][j]!=0){const session = this.$neo4j.getSession();
            session
              .run(
                "Create (a:Participante{id:$name})-[:INTERACTUA]->(b:Participante{id:$name2})",{ name: emisor, name2: receptor }
              )
              .run("OPTIONAL MATCH (a:Participante),(b:Participante) WHERE a.id = $name AND   b.id=$name2 CREATE (a)-[r:INTERACTUA{id:$id,url:$url}]->(b) RETURN a,b", { name: emisor, name2: receptor,id:id,url:url})
              .then((res) => {
                //console.log(res.records[0].get("n.nombre"));
                console.log("Nodo creado", res);
              })
              //.then(() => {
              //  session.close();
              //});
            }
          }
        }
      }
      */
    },
    csvExport() {
      //Creo el archivo CSV
      const { Parser } = require("json2csv");
      const fields = ["Participante", "Comentario", "Fecha"];

      const json2csvParser = new Parser({ fields });
      let chat = getPRChat(
        this.repository.pullRequest.participants.totalCount,
        this.repository.pullRequest
      );
      const csv = json2csvParser.parse(chat);
      let nombreArchivo = "Chat - " + this.repository.pullRequest.title;
      //Exporto ahora el archivo CSV
      const exportName = nombreArchivo + ".csv" || "chatPR.csv";

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, exportName);
      } else {
        const link = document.createElement("a");
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", exportName);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      this.showSnackbar("Archivo CSV Guardado", "success", 4000);
    },
    estadisticasPR() {
      try {
        var cantPersonas = this.repository.pullRequest.participants.totalCount;
        this.cohesionMatrix = cohesionFormula(cantPersonas, this.countMatrix);
        this.colabMatrix = colaboracionFormula(cantPersonas, this.countMatrix);
        this.comunaMatrix = comunaFormula(
          this.repository.pullRequest.participants
        );
        this.mimicaMatrix = mimicaFormula(
          cantPersonas,
          this.repository.pullRequest
        );
        var polaridad = polaridadFormula(
          cantPersonas,
          this.repository.pullRequest
        );
      } catch (error) {
        console.log("Error en EstadisticasPR-Creando formulas: ", error);
        this.showSnackbar(
          "Error al generar las estadisticas: " + error,
          "error",
          8000
        );
      }
      try {
        var coeInd, colabInd, mimicaInd, msjEnviados, msjRecibidos;
        for (let i = 0; i < cantPersonas; i++) {
          coeInd = 0;
          colabInd = 0;
          mimicaInd = 0;
          msjEnviados = 0;
          msjRecibidos = 0;
          //Cuento los mensajes enviados y recibidos para la persona "i"
          for (let j = 0; j < cantPersonas; j++) {
            coeInd += this.cohesionMatrix[i][j];
            colabInd += this.colabMatrix[i][j];
            mimicaInd += this.mimicaMatrix[i][j];
            msjEnviados += this.countMatrix[i][j];
            msjRecibidos += this.countMatrix[j][i];
          }
          //Me aseguro que hayan 2 o mas personas para calcular las cohesiónes
          if (cantPersonas > 1) {
            coeInd = Math.round((coeInd / cantPersonas) * 100) / 100;
            colabInd = Math.round((colabInd / cantPersonas) * 100) / 100;
            mimicaInd = Math.round((mimicaInd / cantPersonas) * 100) / 100;
          }
          //calculo Polaridad
          let tonoInd = 0,
            tonoPos = polaridad[i].positivity,
            tonoNeg = Math.abs(polaridad[i].negativity);
          if (tonoPos + tonoNeg > 0) tonoInd = tonoPos / (tonoPos + tonoNeg);
          //creo la tabla con los datos estaditicos
          let tabla = {
            nombre: this.repository.pullRequest.participants.nodes[i].login,
            coeInd: coeInd,
            colabInd: colabInd,
            mimicaInd: mimicaInd,
            tonoInd: tonoInd,
            msjEnviados: msjEnviados,
            msjRecibidos: msjRecibidos,
          };
          this.estadisticas.push(tabla);
        }
        //Doy formato a las gráficas
        this.chartDataCoheGrupal();
        this.chartDataColabGrupal();
        this.chartDataMimicaGrupal();
        this.chartDataTonoGrupal();
        this.chartDataCohe();
        this.chartDataColab();

        /*let pos = 0;
        this.repository.pullRequest.participants.nodes.forEach(item => {
          this.participantes.push({
            nombre: item.login,
            pos: pos
          });
          pos++;
        });
        this.participante = this.participantes[0];
        this.chartDataMimica();*/
        this.show = true;
      } catch (error) {
        console.log("Error en EstadisticasPR-Haciendo la tabla: ", error);
        this.showSnackbar(
          "Error al generar las estadisticas: " + error,
          "error",
          8000
        );
      }
    },
    agregarID(pullRequest) {
      try{
        //Esta funcion agrega los ID faltantes al JSON de la consulta
        let encontrado = false;
        let index = 0;
        while (!encontrado) {
          if (pullRequest.participants.nodes[index].login == pullRequest.author.login){
            pullRequest.author.id = pullRequest.participants.nodes[index].id;
            encontrado = true;
          } else if (index == pullRequest.participants.totalCount){
            encontrado = true;
          }
          index++;
        }
        //agregamos id a los autores de Comentarios
        for (let c = 0; c < pullRequest.comments.totalCount; c++) {
          let encontrado = false;
          let index = 0;
          while (!encontrado) {
            if (pullRequest.participants.nodes[index].login == pullRequest.comments.nodes[c].author.login) {
              pullRequest.comments.nodes[c].author.id = pullRequest.participants.nodes[index].id;
              encontrado = true;
            } else if (index == pullRequest.participants.totalCount) {
              encontrado = true;
            }
            index++;
          }
        }
        //agregamos id a los autores de Reviews
        for (let i = 0; i < pullRequest.reviewThreads.totalCount; i++) {
          for (let c = 0; c < pullRequest.reviewThreads.nodes[i].comments.totalCount; c++) {
            let encontrado = false;
            let index = 0;
            while (!encontrado) {
              if (pullRequest.participants.nodes[index].login == pullRequest.reviewThreads.nodes[i].comments.nodes[c].author.login) {
                pullRequest.reviewThreads.nodes[i].comments.nodes[c].author.id = pullRequest.participants.nodes[index].id;
                encontrado = true;
              } else if (index == pullRequest.participants.totalCount) {
                encontrado = true;
              }
              index++;
            }
          }
        }
      } catch (error) {
        this.saltarPR = true;
      }
    },
    chartDataCoheGrupal() {
      //Obtengo la cohesión grupal
      let cohesionGrupal = 0;
      this.estadisticas.forEach((item) => {
        cohesionGrupal += item.coeInd;
      });
      cohesionGrupal = (cohesionGrupal / this.estadisticas.length) * 100;
      //Doy formato al valor de CohesionGrupal para el gráfico
      this.chartCoheGrupal.labels[0] = cohesionGrupal.toFixed(2) + "%";
      this.chartCoheGrupal.datasets[0].data[0] = cohesionGrupal;
      this.chartCoheGrupal.datasets[0].data[1] = 100 - cohesionGrupal;
    },
    chartDataColabGrupal() {
      //Obtengo la cohesión grupal
      let colabGrupal = 0;
      this.estadisticas.forEach((item) => {
        colabGrupal += item.colabInd;
      });
      colabGrupal = (colabGrupal / this.estadisticas.length) * 100;
      //Doy formato al valor de colabGrupal para el gráfico
      this.chartColabGrupal.labels[0] = colabGrupal.toFixed(2) + "%";
      this.chartColabGrupal.datasets[0].data[0] = colabGrupal;
      this.chartColabGrupal.datasets[0].data[1] = 100 - colabGrupal;
    },
    chartDataMimicaGrupal() {
      //Obtengo la cohesión grupal
      let mimicaGrupal = 0;
      this.estadisticas.forEach((item) => {
        mimicaGrupal += item.mimicaInd;
      });
      mimicaGrupal = (mimicaGrupal / this.estadisticas.length) * 100;
      //Doy formato al valor de colabGrupal para el gráfico
      this.chartMimicaGrupal.labels[0] = mimicaGrupal.toFixed(2) + "%";
      this.chartMimicaGrupal.datasets[0].data[0] = mimicaGrupal;
      this.chartMimicaGrupal.datasets[0].data[1] = 100 - mimicaGrupal;
    },
    chartDataTonoGrupal() {
      //Obtengo la cohesión grupal
      let tonoGrupal = 0;
      this.estadisticas.forEach((item) => {
        tonoGrupal += item.tonoInd;
      });
      tonoGrupal = (tonoGrupal / this.estadisticas.length) * 100;
      //Doy formato al valor de colabGrupal para el gráfico
      this.chartTonoGrupal.labels[0] = tonoGrupal.toFixed(2) + "%";
      this.chartTonoGrupal.datasets[0].data[0] = tonoGrupal;
      this.chartTonoGrupal.datasets[0].data[1] = 100 - tonoGrupal;
    },
    chartDataCohe() {
      //Genera el dataset para armar el grafico de cohesion individual
      let cantPersonas = this.repository.pullRequest.participants.totalCount;
      this.chartCohe.labels = [];
      this.chartCohe.datasets[0].data = [];
      for (let i = 0; i < cantPersonas; i++) {
        this.chartCohe.labels.push(this.estadisticas[i].nombre);
        this.chartCohe.datasets[0].data.push(
          (this.estadisticas[i].coeInd * 100).toFixed(2)
        );
      }
    },
    chartDataColab() {
      //Genera el dataset para armar el grafico de cohesion individual
      let cantPersonas = this.repository.pullRequest.participants.totalCount;
      this.chartColab.labels = [];
      this.chartColab.datasets[0].data = [];
      for (let i = 0; i < cantPersonas; i++) {
        this.chartColab.labels.push(this.estadisticas[i].nombre);
        this.chartColab.datasets[0].data.push(
          (this.estadisticas[i].colabInd * 100).toFixed(2)
        );
      }
    },
    chartDataMimica() {
      try {
        //Genera el dataset para armar el grafico de mimica
        let cantPersonas = this.repository.pullRequest.participants.totalCount;
        this.chartMimica.labels = [];
        this.chartMimica.datasets.data = [];
        for (let i = 0; i < cantPersonas; i++) {
          if (i != this.participante.pos) {
            this.chartMimica.labels.push(this.estadisticas[i].nombre);
            this.chartMimica.datasets[0].data.push(
              this.mimicaMatrix[this.participante.pos][i]
            );
          }
        }
      } catch (error) {
        console.log("Error en chartDataMimica: ", error);
      }
    },
    refreshQuery(search) {
      this.show = false;
      if (!this.$apollo.skipAll) {
        this.$apollo.skipAll = false;
      }
      this.$apollo.queries.repository
        .refetch({
          owner: search.owner,
          name: search.name,
          number: parseInt(search.number),
        })
        .then(() => {
          if (this.repository.pullRequest.participants.totalCount > 1) {
            //Agrego informacion de IDs faltantes en el PR
            this.agregarID(this.repository.pullRequest);
            //Llamo a hacer el conteo de Interacciones
            this.countMatrix = matrizConteoPR(this.repository.pullRequest, this.ListaMatrix);
            //LLamo a generar las estadisticas en base al conteo
            this.estadisticasPR();
            console.log("Pasó por acá",this.saltarPR);
            if(this.saltarPR==true){
              console.log("El PR Nº ", this.repository.pullRequest.number, " no fue exportado a Neo4J");
              this.saltarPR = false;
            }
             else {
              try {
                
                this.exportarNeo4j();
              } catch (error) {
                console.log(error);
              }
            }
          } else {
            this.showSnackbar(
              "El Pull Request seleccionado no presenta interacciones",
              "info",
              8000
            );
          }
        }); //apollo refetch
    },
  },
};
</script>
