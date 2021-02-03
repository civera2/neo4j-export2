<template>
  <div>
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
    </div>
    <h1 class="subheading-1 blue--text">Descarga de Pull Request</h1>
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

    <div v-if="show">
      <h2 class="subheading-1 blue--text">
        {{ search.owner }} / {{ search.name }}
      </h2>
      <v-btn class="ma-2" color="primary" hidden v-on:click="csvExport()">
        <v-icon left>mdi-file-table</v-icon>Exportar CSV</v-btn
      >
      <v-btn color="primary" v-on:click="saveFile()">
        <v-icon left>mdi-download</v-icon>Guardar json</v-btn
      >

      <v-container fluid>
        <v-textarea
          class="ma-2"
          name="input-7-1"
          outlined
          label="Lista de Usuarios"
          auto-grow
          :value="usersList"
        ></v-textarea>
      </v-container>
    </div>
  </div>
</template>

<script>
import PRSelector from "../components/PRSelector";
import { GET_REPOS, REPOSITORY_PRS } from "../graphql/queries.js";
import {
  matrizConteoPR,
  cohesionFormula,
  colaboracionFormula,
  //duracionPRdias,
  mimicaFormula,
  polaridadFormula,
  getParticipantesRepoStat,
} from "../formulas.js";

export default {
  components: { PRSelector },
  data() {
    return {
      search: { owner: "", name: "" },
      emptyRules: [(v) => !!v || "Ingrese algun valor"],
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
      estadisticasPersona: "",
      pullRequests: [],
      repository: "",
      estadisticas: [],
      pullRequestsJSON: "",
      usersList: [],
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
    csvExport() {
      //Creo el archivo CSV
      const { Parser } = require("json2csv");
      const fields = [
        "PR",
        "cohesionGrupal",
        "cohesionGrupalVarianza",
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
    saveFile() {
      const data = this.pullRequestsJSON,
        blob = new Blob([data], { type: "text/plain" }),
        e = document.createEvent("MouseEvents"),
        a = document.createElement("a");
      a.download = this.search.name + " - pullRequests" + ".json";
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

        let login, id;
        if (pullRequest.participants.nodes[i]) {
          login = pullRequest.participants.nodes[i].login;
          id = pullRequest.participants.nodes[i].id;
        } else login = "|Usuario Borrado|";
        //creola tabla con los datos estaditicos
        tabla.push({
          id: id,
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

      /*Obtengo la varianza de cohesión
      let coheGrupalVarianza = 0;
      tabla.forEach((item) => {
        coheGrupalVarianza +=
          (item.coeInd - cohesionGrupal) * (item.coeInd - cohesionGrupal);
      });
      coheGrupalVarianza = coheGrupalVarianza / tabla.length;*/

      //Obtengo la duracion del PR en días
      //let duracionDias = duracionPRdias(pullRequest.createdAt,pullRequest.closedAt);

      //Adjunto las estadisticas a los datos del Pull Request
      let estadisticaPR = {
        //TODO:id: index,
        statsIndividuales: tabla,
        matrizInteracciones: this.countMatrix,
        cohesionGrupal: cohesionGrupal.toFixed(2),
        colaboracionGrupal: colabGrupal.toFixed(2),
        mimicaGrupal: mimicaGrupal.toFixed(2),
        tonoGrupal: tonoGrupal.toFixed(2),
        cohesionMatriz: this.cohesionMatrix,
        mimicaMatriz: this.mimicaMatrix,
        colabMatriz: this.colabMatrix,
        polaridadTabla: polaridad,
        //fechaInicio: duracionDias.createdAt,
        //fechaCierre: duracionDias.closedAt,
        //duraccionDias: duracionDias.diff || "-",
      };
      this.estadisticas.push(estadisticaPR);
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
          self.search = search;
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
              //if (PR.participants.totalCount > 1)
              self.pullRequests.push(PR);
            });

            //Calculo la matriz de conteo y estadisticas para cada PR
            self.estadisticas = [];
            self.pullRequests.forEach((PR) => {
              self.countMatrix = matrizConteoPR(PR);
              self.getEstadisticas(PR);
            });

            //llamo a crear la tabla de estadisticas de cada persona
            self.estadisticasPersona = getParticipantesRepoStat(
              self.estadisticas
            );
            self.usersList = [];
            self.estadisticasPersona.forEach((persona) => {
              self.usersList.push(persona.login);
            });

            for (let i = 0; i < self.pullRequests.length; i++) {
              self.pullRequests[i].estadisticas = self.estadisticas[i];
            }

            var listaParticipantesRepo = [];
            try {
              self.estadisticas.forEach((PR) => {
                PR.statsIndividuales.forEach((participante) => {
                  let cantParticipantes = listaParticipantesRepo.length;
                  let encontrado = true;
                  let i = 0;
                  while (encontrado && i < cantParticipantes) {
                    if (listaParticipantesRepo[i] == participante.id)
                      encontrado = false;
                    else i++;
                  }
                  if (encontrado) {
                    //agrego stats como participante nuevo
                    listaParticipantesRepo.push(participante.id);
                  }
                });
              });
            } catch (error) {
              console.log("Error creando listaParticipantesRepo. ", error);
            }
            self.pullRequests.push(listaParticipantesRepo);

            self.pullRequestsJSON = JSON.stringify(self.pullRequests);

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
