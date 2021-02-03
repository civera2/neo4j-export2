<template>
  <div class="pullrequest">
    <h1 class="subheading-1 blue--text">Pull Request</h1>
    <PRSelector v-on:searchPR="refreshQuery"></PRSelector>
    <v-progress-linear
      v-if="$apollo.loading"
      indeterminate
      color="primary"
    ></v-progress-linear>
    <v-divider class="mb-2"></v-divider>
    <h1 v-if="show" class="headline grey--text">
      {{ repository.pullRequest.title }}
      <a class="subheading" target="_blank" :href="repository.pullRequest.url">
        #{{ repository.pullRequest.number }}
      </a>
    </h1>
    <v-container v-if="show">
      <Comment
        v-bind:avatarUrl="repository.pullRequest.author.avatarUrl"
        v-bind:login="repository.pullRequest.author.login"
        v-bind:createdAt="repository.pullRequest.createdAt"
        v-bind:reactCant="repository.pullRequest.reactions.totalCount"
        v-bind:body="repository.pullRequest.bodyHTML"
        ><v-divider></v-divider>
      </Comment>
      <Comment
        v-for="item in repository.pullRequest.comments.nodes"
        v-bind:avatarUrl="item.author.avatarUrl"
        v-bind:login="item.author.login"
        v-bind:createdAt="item.createdAt"
        v-bind:reactCant="item.reactions.totalCount"
        v-bind:body="item.bodyHTML"
        v-bind:key="item.id"
      >
        <v-divider></v-divider>
      </Comment>
      <h1 class="subheading grey--text mt-3">Reviews:</h1>
      <div
        v-for="item in repository.pullRequest.reviewThreads.nodes"
        v-bind:key="item.id"
        class="my-2 ml-4"
      >
        <Comment
          v-for="com in item.comments.nodes"
          v-bind:avatarUrl="com.author.avatarUrl"
          v-bind:login="com.author.login"
          v-bind:createdAt="com.createdAt"
          v-bind:reactCant="com.reactions.totalCount"
          v-bind:body="com.bodyHTML"
          v-bind:key="com.id"
        >
          <v-divider></v-divider>
        </Comment>
      </div>
    </v-container>
  </div>
</template>

<script>
import Comment from "../components/Comment";
import PRSelector from "../components/PRSelector";
import { GET_REPO } from "../graphql/queries.js";

export default {
  components: {
    Comment,
    PRSelector,
  },
  data() {
    return {
      show: false,
      repository: "",
    };
  },
  apollo: {
    repository: {
      query: GET_REPO,
      variables: { owner: "cdr", name: "code-server", number: 154 },
    },
  },
  methods: {
    refreshQuery(search) {
      this.$apollo.queries.repository
        .refetch({
          owner: search.owner,
          name: search.name,
          number: parseInt(search.number),
        })
        .then(() => {
          this.show = true;
        })
        .catch((err) => {
          console.log("Ocurrio un problema al buscar el PR: ", err.message);
          this.show = false;
        });
    }, //refresh query
  },
};
</script>
