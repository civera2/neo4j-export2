import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import firebaseApp from "./FirebaseApp";

import Repositorio from "./views/Repositorio.vue";
import UserStats from "./views/UserStats.vue";
import PullRequest from "./views/PullRequest.vue";
import Acerca from "./views/Acerca.vue";
import repoDescarga from "./views/repoDescarga.vue";
import Neo4j from "./views/Neo4j.vue";

Vue.use(Router);

let router = new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "*",
      redirect: "/",
    },
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/pullrequest",
      name: "pullrequest",
      component: PullRequest,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/repositorio",
      name: "repositorio",
      component: Repositorio,
    },
    {
      path: "/repodescarga",
      name: "repodescarga",
      component: repoDescarga,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/neo4j",
      name: "neo4j",
      component: Neo4j,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/userstats",
      name: "userstats",
      component: UserStats,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/acerca",
      name: "acerca",
      component: Acerca,
    },
  ],
});

//Nav Royal Guards
router.beforeEach((to, from, next) => {
  //check for requireddAuth guard
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    //check if NOT logged in
    if (!firebaseApp.auth().currentUser) {
      //Go to login
      next({
        path: "/error",
        query: {
          redirect: to.fullPath,
        },
      });
    } else next();
  } else if (to.matched.some((record) => record.meta.requiresGuest)) {
    //check if logged in
    if (firebaseApp.auth().currentUser) {
      //Go to login
      next({
        path: "/",
        query: {
          redirect: to.fullPath,
        },
      });
    } else next();
  } else next();
});

export default router;
