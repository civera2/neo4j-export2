<template>
  <div>
    <div class="text-center">
      <v-snackbar
        right
        v-model="snackbar.show"
        :timeout="snackbar.timeout"
        :color="snackbar.color"
      >
        {{ snackbar.text }}
        <v-btn dark text @click="snackbar.show = false">Close</v-btn>
      </v-snackbar>
    </div>
    <h1 class="subheading-1 blue--text">Repositorio</h1>
    <PRSelector
      v-on:search-pr="getRepoPRcant"
      v-bind:hideNumber="true"
    ></PRSelector>
    <p v-if="loading" class="font-weight-light">{{ progress.text }}</p>
    <v-progress-linear
      v-if="loading"
      color="primary"
      :buffer-value="progress.bartotal"
      :value="progress.bartotal"
      stream
    ></v-progress-linear>
    <v-divider class="mb-2"></v-divider>
    <!--///////////////////////////////////////////////////////////////////////////////-->
    <v-btn
      class="mb-2"
      :color="colorCancel"
      v-on:click="toggleCancelar"
      v-if="loading"
    >
      <v-icon left>mdi-cancel</v-icon>Detener Busqueda</v-btn
    >

    <v-btn v-if="!show && !loading" color="primary" @click.native="btnLoadFile">
      <v-icon left>mdi-download</v-icon>Cargar json</v-btn
    >

    <div v-if="show">
      <v-card pa-2 outlined>
        <h4>Metricas Grupales de Proyecto</h4>
        <v-row>
          <v-col sm="12" md="3">
            <v-layout column>
              <v-flex>
                <p>
                  Participantes:
                  {{ this.estadisticasPersona.length }}
                </p>
              </v-flex>
              <v-flex>
                <p>
                  Cant. Colaboradores:<!--
                  {{this.pullRequests.additions + this.pullRequests.deletions}}-->
                </p>
              </v-flex>
              <v-flex>
                <p>
                  PR Merged:<!--
                  {{this.pullRequests.additions + this.pullRequests.deletions}}-->
                </p>
              </v-flex>
              <v-flex>
                <p>
                  PR Cerrados:
                  <!--{{ this.pullRequests.state }}-->
                </p>
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

      <v-btn class="ma-2" color="primary" v-on:click="csvExport()">
        <v-icon left>mdi-file-table</v-icon>Exportar CSV</v-btn
      >
      <v-btn class="mx-2" color="primary" @click.native="btnLoadFile">
        <v-icon left>mdi-download</v-icon>Cargar json</v-btn
      >
      <v-btn color="primary" v-on:click="saveFile()">
        <v-icon left>mdi-upload</v-icon>Guardar json</v-btn
      >
      <h4 class="mt-4">Tabla de Pull Request</h4>
      <v-data-table
        :headers="encabezados"
        :items="estadisticas"
        :items-per-page="20"
        class="elevation-1 mt-2"
      ></v-data-table>
      <h4 class="mt-4">Tabla de Personas</h4>
      <v-data-table
        :headers="encabezadosPersona"
        :items="estadisticasPersona"
        :items-per-page="20"
        class="elevation-1 mt-2"
      ></v-data-table>
    </div>
    <input
      id="file-upload"
      type="file"
      ref="myFile"
      style="display:none"
      @change="loadFile"
    /><br />
  </div>
</template>

<script>
import PRSelector from "../components/PRSelector";
import { GET_REPOS, REPOSITORY_PRS } from "../graphql/queries.js";
import Doughnut from "../components/chartjs/Doughnut.vue";
import {
  matrizConteoPR,
  cohesionFormula,
  colaboracionFormula,
  duracionPRdias,
  mimicaFormula,
  polaridadFormula,
  getParticipantesRepoStat,
} from "../formulas.js";

export default {
  components: { PRSelector, Doughnut },
  data() {
    return {
      loading: false,
      progress: {
        text: "Cargando",
        bar: 0,
        bartotal: 0,
        totalPR: 0,
      },
      show: false,
      snackbar: {
        show: false,
        text: "Bienvenido a Gitana: Analíticas de Github",
        color: "info",
        timeout: 2500,
      },
      colorCancel: "error",
      cancel: true,
      getPR: "",
      countPRs: [],
      countMatrix: "",
      cohesionMatrix: "",
      colabMatrix: "",
      mimicaMatrix: "",
      encabezados: [
        { text: "PR#", sortable: false, value: "PR" },
        { text: "Cohesión Grupal", value: "cohesionGrupal" },
        { text: "CG Varianza", value: "cohesionGrupalVarianza" },
        { text: "Colaboración Grupal", value: "colaboracionGrupal" },
        { text: "Mímica Grupal", value: "mimicaGrupal" },
        { text: "Polaridad Grupal", value: "tonoGrupal" },
        { text: "Participantes", value: "participantes" },
        { text: "Fecha Inicio", value: "fechaInicio" },
        { text: "Fecha Cierre", value: "fechaCierre" },
        { text: "Duración Dias", value: "duraccionDias" },
        { text: "Código Agregado", value: "codigoAdd" },
        { text: "Código Quitado", value: "codigoRem" },
        { text: "Total Cambios", value: "sizePR" },
        { text: "Estado", value: "estado" },
      ],
      encabezadosPersona: [
        { text: "Usuario", sortable: false, value: "login" },
        { text: "Cant. PR Author", value: "CantPRAuthor" },
        { text: "Cant. PR Participa", value: "CantPRParticipa" },
        { text: "Cohesión Individual", value: "coheInd" },
        { text: "Habilidad", value: "habilidad" },
        { text: "Mimica", value: "mimicaInd" },
        { text: "Polaridad", value: "tonoInd" },
      ],
      estadisticasPersona: "",
      pullRequests: [],
      repository: "",
      estadisticas: [],
      ListaMatrix: [],
      saltarPR: false,
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
    };
  },
  apollo: {
    getPR: {
      query: GET_REPOS,
      variables: {
        owner: "flacket",
        name: "githubanalytic",
        reactions: 1,
        participants: 1,
        comments: 1,
        commentsReactions: 1,
        rvThreads: 1,
        rvThreadsComments: 1,
      },
      update: (data) => data.repository,
    },
    getPRcant: {
      query: REPOSITORY_PRS,
      variables: {
        owner: "flacket",
        name: "githubanalytic",
      },
      update: (data) => data.repository.pullRequests,
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
    progressbar() {
      if (this.progress.bar == 0) {
        this.progress.text = "Cargando " + this.progress.totalPR + " PR's.";
        this.progress.bartotal = 0;
        this.progress.bar = 100 / (Math.ceil(this.progress.totalPR / 15) * 2);
      } else {
        this.progress.bartotal = this.progress.bartotal + this.progress.bar;
        this.progress.text =
          "Cargando " +
          this.progress.totalPR +
          " PR's. " +
          Math.floor(this.progress.bartotal) +
          "% Completado";
      }
    },
    btnLoadFile() {
      document.getElementById("file-upload").click();
    },
    csvExport() {
      //Creo el archivo CSV
      const { Parser } = require("json2csv");
      const fields = [
        "PR",
        "cohesionGrupal",
        "cohesionGrupalVarianza",
        "colaboracionGrupal",
        "participantes",
        "fechaInicio",
        "fechaCierre",
        "duraccionDias",
        "codigoAdd",
        "codigoRem",
        "sizePR",
        "estado",
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(this.estadisticas);
      //Exporto ahora el archivo CSV
      const exportName = "informe" + ".csv" || "export.csv";
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
    loadFile() {
      let file = this.$refs.myFile.files[0];
      if (!file) return;
      this.show = false;
      this.loading = true;
      // Credit: https://stackoverflow.com/a/754398/52160
      let reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = (evt) => {
        //this.pullRequests = JSON.parse(evt.target.result);
        let pullReqs = JSON.parse(evt.target.result);

        this.pullRequests = [];
        pullReqs.forEach((PR) => {
          if (PR.participants.totalCount > 1) {
            this.pullRequests.push(PR);
          }
        });

        //Calculo la matriz de conteo y estadisticas para cada PR
        this.estadisticas = [];
        this.pullRequests.forEach((PR) => {
          this.countMatrix = matrizConteoPR(PR);
          this.getEstadisticas(PR);
        });

        //llamo a crear la tabla de estadisticas de cada persona
        this.estadisticasPersona = getParticipantesRepoStat(this.estadisticas);
        //Doy formato a las gráficas
        this.chartsDataGrupal();

        this.show = true;
        this.progress.bar = 0;
        this.loading = false;
      };
      reader.onerror = (evt) => {
        this.showSnackbar(
          "Error al cargar el archivo: \n" + evt,
          "error",
          8000
        );
      };
    },
    saveFile() {
      const data = JSON.stringify(this.pullRequests),
        blob = new Blob([data], { type: "text/plain" }),
        e = document.createEvent("MouseEvents"),
        a = document.createElement("a");
      a.download = "informe" + ".json";
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
      e.initEvent("click", true, false);
      a.dispatchEvent(e);
      this.showSnackbar("Archivo JSON Guardado", "success", 4000);
    },
    toggleCancelar() {
      this.cancel = !this.cancel;
      if (this.cancel) this.colorCancel = "error";
      else this.colorCancel = "warning";
    },
    exportarNeo4j(pullRequest) {
      //const session = this.$neo4j.getSession();
      var matriz = this.countMatrix;
      var participantes = pullRequest.participants;
      var cantPersonas = pullRequest.participants.totalCount;
      var id= pullRequest.id;
      var url= pullRequest.url;

      //let participantes = new Array();
      /*pullRequest.participants.nodes.forEach(function(element) {
      participantes.push(element.login);
       //participants.push(element.id);
       });*/
      //console.log("matriz",this.countMatrix);
      for (let i = 0; i < cantPersonas; i++) {
        var emisor = participantes.nodes[i].login;
        for (let j = 0; j < cantPersonas; j++) {
          
          var receptor = participantes.nodes[j].login;
          //console.log("matriz",matriz[i][j],"emisor",emisor,"receptor",receptor);
          for (let k = 0; k < matriz[i][j]; k++) {
            //var emisor = participantes.nodes[i].login;
            //var receptor = participantes.nodes[j].login;
            if(matriz[i][j]!=0){const session = this.$neo4j.getSession();
            session
              /*.run(
                "Create (a:Participante{id:$name})-[:INTERACTUA]->(b:Participante{id:$name2})",{ name: emisor, name2: receptor }
              )*/
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
    },
    getEstadisticas(pullRequest) {
      try {
        var cantPersonas = pullRequest.participants.totalCount;
        this.cohesionMatrix = cohesionFormula(cantPersonas, this.countMatrix);
        this.colabMatrix = colaboracionFormula(cantPersonas, this.countMatrix);
        this.mimicaMatrix = mimicaFormula(cantPersonas, pullRequest);
        var polaridad = polaridadFormula(cantPersonas, pullRequest);
        //console.log("Habilidad del participante:", listPersonas);
      } catch (error) {
        console.log("Error en EstadisticasPR-Creando formulas: ", error);
        this.showSnackbar(
          "Error al generar las estadisticas: " + error,
          "error",
          8000
        );
      }
      let tabla = new Array();
      let coeInd, colabInd, mimicaInd, msjEnviados, msjRecibidos;
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
        //Me aseguro que hayan mas de 2 personas para calcular las cohesiónes
        if (cantPersonas > 1) {
          coeInd = Math.round((coeInd / (cantPersonas - 1)) * 100) / 100;
          colabInd = Math.round((colabInd / cantPersonas) * 100) / 100;
          mimicaInd = Math.round((mimicaInd / cantPersonas) * 100) / 100;
        }
        //calculo Polaridad
        let tonoInd = 0,
          tonoPos = polaridad[i].positivity,
          tonoNeg = Math.abs(polaridad[i].negativity);
        if (tonoPos + tonoNeg > 0) tonoInd = tonoPos / (tonoPos + tonoNeg);

        let login;
        if (pullRequest.participants.nodes[i])
          login = pullRequest.participants.nodes[i].login;
        else login = "|Usuario Borrado|";

        //creo la tabla con los datos estaditicos
        tabla.push({
          login: login,
          coeInd: coeInd,
          colabInd: colabInd,
          mimicaInd: mimicaInd,
          tonoInd: tonoInd,
          msjEnviados: msjEnviados,
          msjRecibidos: msjRecibidos,
        });
      }

      //Saco estadisticas de grupo
      let cohesionGrupal = 0;
      let colabGrupal = 0;
      let mimicaGrupal = 0;
      let tonoGrupal = 0;
      tabla.forEach((item) => {
        cohesionGrupal += item.coeInd;
        colabGrupal += item.coeInd;
        mimicaGrupal += item.mimicaInd;
        tonoGrupal += item.tonoInd;
      });
      cohesionGrupal = cohesionGrupal / tabla.length;
      colabGrupal = colabGrupal / tabla.length;
      mimicaGrupal = mimicaGrupal / tabla.length;
      tonoGrupal = tonoGrupal / tabla.length;

      //Obtengo la varianza de cohesión
      let coheGrupalVarianza = 0;
      tabla.forEach((item) => {
        coheGrupalVarianza +=
          (item.coeInd - cohesionGrupal) * (item.coeInd - cohesionGrupal);
      });
      coheGrupalVarianza = coheGrupalVarianza / tabla.length;

      //Obtengo la duracion del PR en días
      let duracionDias = duracionPRdias(
        pullRequest.createdAt,
        pullRequest.closedAt
      );

      //Calculo el estado del PR
      let estado = pullRequest.state;
      /*switch (pullRequest.state) {
        case "MERGED": estado = 1;break;
        case "CLOSED": estado = 0;break;
        case "OPEN": estado = 0.5;break;}*/

      let author;
      if (pullRequest.author) author = pullRequest.author.login;
      else author = "|Usuario Borrado|";

      //Adjunto las estadisticas a los datos del Pull Request
      let estadisticaPR = {
        //TODO:id: index,
        PR: pullRequest.number,
        statsIndividuales: tabla,
        cohesionGrupal: cohesionGrupal.toFixed(2),
        cohesionGrupalVarianza: coheGrupalVarianza.toFixed(2),
        colaboracionGrupal: colabGrupal.toFixed(2),
        mimicaGrupal: mimicaGrupal.toFixed(2),
        tonoGrupal: tonoGrupal.toFixed(2),
        fechaInicio: duracionDias.createdAt,
        fechaCierre: duracionDias.closedAt,
        duraccionDias: duracionDias.diff || "-",
        codigoAdd: pullRequest.additions,
        codigoRem: pullRequest.deletions,
        sizePR: pullRequest.additions + pullRequest.deletions,
        estado: estado,
        cohesionMatrix: this.cohesionMatrix,
        participantes: cantPersonas,
        autor: author,
      };
      this.estadisticas.push(estadisticaPR);
    },
    chartsDataGrupal() {
      //Obtengo la cohesión grupal
      var cant = this.estadisticas.length;
      let cohesionGrupal = 0;
      let colabGrupal = 0;
      let mimicaGrupal = 0;
      let tonoGrupal = 0;

      for (let i = 0; i < cant; i++) {
        cohesionGrupal += Number(this.estadisticas[i].cohesionGrupal);
        colabGrupal += Number(this.estadisticas[i].colaboracionGrupal);
        mimicaGrupal += Number(this.estadisticas[i].mimicaGrupal);
        tonoGrupal += Number(this.estadisticas[i].tonoGrupal);
      }
      cohesionGrupal = (cohesionGrupal / cant) * 100;
      colabGrupal = (colabGrupal / cant) * 100;
      mimicaGrupal = (mimicaGrupal / cant) * 100;
      tonoGrupal = (tonoGrupal / cant) * 100;

      //Doy formato al valor de CohesionGrupal para el gráfico
      this.chartCoheGrupal.labels[0] = cohesionGrupal.toFixed(2) + "%";
      this.chartCoheGrupal.datasets[0].data[0] = cohesionGrupal;
      this.chartCoheGrupal.datasets[0].data[1] = 100 - cohesionGrupal;
      //Doy formato al valor de colabGrupal para el gráfico
      this.chartColabGrupal.labels[0] = colabGrupal.toFixed(2) + "%";
      this.chartColabGrupal.datasets[0].data[0] = colabGrupal;
      this.chartColabGrupal.datasets[0].data[1] = 100 - colabGrupal;

      //Doy formato al valor de mimicaGrupal para el gráfico
      this.chartMimicaGrupal.labels[0] = mimicaGrupal.toFixed(2) + "%";
      this.chartMimicaGrupal.datasets[0].data[0] = mimicaGrupal;
      this.chartMimicaGrupal.datasets[0].data[1] = 100 - mimicaGrupal;

      //Doy formato al valor de tonoGrupal para el gráfico
      this.chartTonoGrupal.labels[0] = tonoGrupal.toFixed(2) + "%";
      this.chartTonoGrupal.datasets[0].data[0] = tonoGrupal;
      this.chartTonoGrupal.datasets[0].data[1] = 100 - tonoGrupal;
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
    getRepoPRcant(search) {
      var self = this;
      //Hago la consulta
      if (!this.$apollo.skipAll) {
        this.$apollo.skipAll = false;
      }
      this.$apollo.queries.getPRcant
        .refetch({
          owner: search.owner,
          name: search.name,
        })
        .then(() => {
          self.progress.totalPR = self.getPRcant.totalCount;
          self.progressbar();
          self.countQuery(search);
        });
    },
    countQuery(search) {
      //Esta funcion crea una lista con la cantidad de datos que se necesitan
      //extraer para cada Pull Request (comentarios, reacciones, etc.)
      //Optimizando así la busqueda y reduciendo la cantidad de llamadas a la API.
      //Por cada 50 Pull Request almacena el maximo de datos que hay que traer
      this.show = false;
      this.loading = true;
      this.estadisticas = [];
      this.pullRequests = "";
      var self = this;
      let afterCursor;
      let beforeCursor;
      let hasNextPage = false;
      //reviso si el array esta vacio (Primer Consulta)
      //sino tomo el cursor de la ultima consluta
      beforeCursor = null;
      if (this.countPRs.length == 0) afterCursor = null;
      else afterCursor = this.countPRs[this.countPRs.length - 1].endCursor;
      //Creo un nuevo item en el arreglo de countPRs donde guardar el resultado de la consulta
      this.countPRs.push({
        comments: 0,
        reviewThreads: 0,
        reactions: 0,
        participants: 0,
        reviewThreadsComments: 0,
        commentsReactions: 0,
        endCursor: null,
        startCursor: null,
      });
      this.$apollo.queries.getPR
        .refetch({
          owner: search.owner,
          name: search.name,
          afterCursor: afterCursor,
          beforeCursor: beforeCursor,
          reactions: 1,
          participants: 1,
          rvThreads: 1,
          comments: 1,
          rvThreadsComments: 1,
          commentsReactions: 1,
        })
        .then(() => {
          let i = self.countPRs.length - 1;
          //cargo los primeros valores del contador PR
          self.countPRs[i].startCursor =
            self.getPR.pullRequests.pageInfo.startCursor;
          self.countPRs[i].endCursor =
            self.getPR.pullRequests.pageInfo.endCursor;
          hasNextPage = self.getPR.pullRequests.pageInfo.hasNextPage;
          self.getPR.pullRequests.nodes.forEach(function(item) {
            if (item.comments.totalCount > self.countPRs[i].comments) {
              if (item.comments.totalCount > 100) {
                self.countPRs[i].comments = 100;
                console.log(
                  "Se superó el limite de la API - Limitado a 100 (PR:",
                  self.countPRs[i],
                  ", comments"
                );
              } else self.countPRs[i].comments = item.comments.totalCount;
            }
            if (
              item.reviewThreads.totalCount > self.countPRs[i].reviewThreads
            ) {
              if (item.reviewThreads.totalCount > 100) {
                self.countPRs[i].reviewThreads = 100;
                console.log(
                  "Se superó el limite de la API - Limitado a 100 (PR:",
                  self.countPRs[i],
                  ", reviewThreads"
                );
              } else
                self.countPRs[i].reviewThreads = item.reviewThreads.totalCount;
            }
            if (item.reactions.totalCount > self.countPRs[i].reactions) {
              if (item.reactions.totalCount > 100) {
                self.countPRs[i].reactions = 100;
                console.log(
                  "Se superó el limite de la API - Limitado a 100 (PR:",
                  self.countPRs[i],
                  ", reactions"
                );
              } else self.countPRs[i].reactions = item.reactions.totalCount;
            }
            if (item.participants.totalCount > self.countPRs[i].participants) {
              if (item.participants.totalCount > 100) {
                self.countPRs[i].participants = 100;
                console.log(
                  "Se superó el limite de la API - Limitado a 100 (PR:",
                  self.countPRs[i],
                  ", participants"
                );
              } else
                self.countPRs[i].participants = item.participants.totalCount;
            }
          });
          //si es el primer conjunto buscado
          if (i == 0) {
            afterCursor = null;
            beforeCursor = self.countPRs[i].endCursor;
          } else {
            afterCursor = self.countPRs[i - 1].endCursor;
            beforeCursor = null;
          }
          //Busco los valores que faltan que estan anidados dentro de lo recien consultado
          self.$apollo.queries.getPR
            .refetch({
              owner: search.owner,
              name: search.name,
              afterCursor: afterCursor,
              beforeCursor: beforeCursor,
              reactions: 1,
              participants: 1,
              rvThreads: self.countPRs[i].reviewThreads,
              comments: self.countPRs[i].comments,
              rvThreadsComments: 1,
              commentsReactions: 1,
            })
            .then(() => {
              //caargo los ultimos valores del contador PR
              self.getPR.pullRequests.nodes.forEach(function(item) {
                item.reviewThreads.nodes.forEach(function(revThread) {
                  if (
                    revThread.comments.totalCount >
                    self.countPRs[i].reviewThreadsComments
                  ) {
                    if (revThread.comments.totalCount > 100) {
                      self.countPRs[i].reviewThreadsComments = 100;
                      console.log(
                        "Se superó el limite de la API - Limitado a 100 (PR:",
                        self.countPRs[i],
                        ", reviewThreadsComments"
                      );
                    } else
                      self.countPRs[i].reviewThreadsComments =
                        revThread.comments.totalCount;
                  }
                });
                item.comments.nodes.forEach(function(comm) {
                  if (
                    comm.reactions.totalCount >
                    self.countPRs[i].commentsReactions
                  ) {
                    if (comm.reactions.totalCount > 100) {
                      self.countPRs[i].commentsReactions = 100;
                      console.log(
                        "Se superó el limite de la API - Limitado a 100 (PR:",
                        self.countPRs[i],
                        ", commentsReactions"
                      );
                    } else
                      self.countPRs[i].commentsReactions =
                        comm.reactions.totalCount;
                  }
                });
              });
              self.progressbar();
              //NOTE:
              //Reviso si faltan cargar más Pull Requests desde la paginación de la API
              //Si estan todos los datos, Llamo a la funcion getFullPR.
              if (hasNextPage && self.cancel) self.countQuery(search);
              else {
                self.getFullPR(search, 0);
              }
            }); //repository.refetch2*/
        }); //repository.refetch
      //this.refreshQuery(search)
    }, //countQuery
    getFullPR(search, index) {
      //Esta funcion busca los datos de los Pull Request
      //analizando la lista de this.countPRs y pidiendo
      //solo la cantidad necesaria de datos a la API
      var self = this;
      let afterCursor;
      let beforeCursor;
      //si es el primer conjunto buscado
      if (index == 0) {
        afterCursor = null;
        beforeCursor = self.countPRs[index].endCursor;
      } else {
        afterCursor = self.countPRs[index - 1].endCursor;
        beforeCursor = null;
      }
      this.$apollo.queries.getPR
        .refetch({
          owner: search.owner,
          name: search.name,
          afterCursor: afterCursor,
          beforeCursor: beforeCursor,
          reactions: this.countPRs[index].reactions,
          participants: this.countPRs[index].participants,
          comments: this.countPRs[index].comments,
          rvThreads: this.countPRs[index].reviewThreads,
          rvThreadsComments: this.countPRs[index].reviewThreadsComments,
          commentsReactions: this.countPRs[index].commentsReactions,
        })
        .then(() => {
          let parser = JSON.stringify(self.getPR.pullRequests.nodes);
          parser = parser.substring(1, parser.length - 1);
          self.pullRequests += parser;
          self.progressbar();
          //Reviso si faltan PRs por agregar a la lista
          if (index < self.countPRs.length - 1) {
            self.pullRequests += ",";
            self.getFullPR(search, index + 1);
          } else {
            //Transformo a Objeto la lista de self.pullRequests
            let aux = "[" + self.pullRequests + "]";
            let pullReqs = JSON.parse(aux);

            self.pullRequests = [];
            pullReqs.forEach((PR) => {
              if (PR.participants.totalCount > 1) {
                self.pullRequests.push(PR);
              }
            });

            //Calculo la matriz de conteo y estadisticas para cada PR
            self.estadisticas = [];
            self.pullRequests.forEach((PR) => {
              //Agrego informacion de IDs faltantes en el PR
              self.agregarID(PR);
              //Llamo a hacer el conteo de Interacciones
              self.countMatrix = matrizConteoPR(PR, self.ListaMatrix);
              //LLamo a generar las estadisticas en base al conteo
              self.getEstadisticas(PR);
              if(self.saltarPR){
                self.saltarPR = false;
                console.log("El PR Nº ", PR.number, " no fue exportado a Neo4J");
                try {
                  self.exportarNeo4j();
                } catch (error) {
                  //console.log(error);
                }
              }
            });
            //llamo a crear la tabla de estadisticas de cada persona
            self.estadisticasPersona = getParticipantesRepoStat(
              self.estadisticas
            );
            //Doy formato a las gráficas
            self.chartsDataGrupal();

            self.countPRs = [];
            self.show = true;
            self.progress.bar = 0;
            self.loading = false;
            self.showSnackbar("Análisis Finalizado", "success", 4000);
          }
        });
    }, //getFullPR
  },
};
</script>
