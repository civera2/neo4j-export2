<script>
import { Doughnut, mixins } from "vue-chartjs";
const { reactiveProp } = mixins;

export default {
  extends: Doughnut,
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
        legend: { display: true },
        tooltips: { enabled: false },
        cutoutPercentage: 60,
      },
    };
  },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
};
</script>
