<script>
import { Radar, mixins } from "vue-chartjs";
const { reactiveProp } = mixins;

export default {
  extends: Radar,
  mixins: [reactiveProp],
  props: {
    chartData: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      options: {
        responsive: true,
        maintainAspectRatio: true,
        legend: { display: false },
      },
    };
  },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
};
</script>
