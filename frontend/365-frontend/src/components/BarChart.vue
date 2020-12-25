<script>
import { Bar, mixins } from "vue-chartjs";
const { reactiveProp } = mixins;
export default {
  extends: Bar,

  mixins: [reactiveProp],
  props: ["options", "data"],
  mounted() {
    this.renderChart(this.data, this.options);
  },
};
</script>

<style></style>
