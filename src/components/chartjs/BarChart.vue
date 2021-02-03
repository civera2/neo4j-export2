<script>
import { Bar, mixins } from "vue-chartjs";
const { reactiveProp } = mixins;

export default {
  extends: Bar,
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
        scales: {
          yAxes: [
            {
              display: true,
              ticks: {
                suggestedMin: 0, // minimum will be 0, unless there is a lower value.
                // OR //
                beginAtZero: true, // minimum value will be 0.
                max: 100,
              },
            },
          ],
        },
      },
    };
  },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
};
</script>
