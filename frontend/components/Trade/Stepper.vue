<template>
  <div class="trade-stepper">
    <div v-for="(step, index) in steps" :key="index" class="step">
      <div class="long" :style="stylesOrder"></div>
      <div class="range" :style="stylesRange">{{ step.factor }}</div>
      <div class="short" :style="stylesOrder"></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    ratio: {
      type: Number,
      default: 2,
    },
    leverage: {
      type: Number,
      default: 50,
    },
    price: {
      type: Number,
      default: 100,
    },
    size: {
      type: Number,
      default: 100,
    },
  },
  computed: {
    stylesRange() {
      const totalsizes = this.ratio * 2 + 1
      return {
        height: `${100 / totalsizes}%`,
      }
    },
    stylesOrder() {
      const totalsizes = this.ratio * 2 + 1
      return {
        height: `${(100 / totalsizes) * 2}%`,
      }
    },
    steps() {
      const step = {
        factor: 1,
        total: 0,
        profit: 0,
        profitTotal: 0,
      }
      return [...Array(10)].map((_, i) => {
        if (i > 0) {
          do {
            step.factor += 1
            step.profit = step.factor * (this.ratio - 1)
            step.profitTotal = step.profit - step.total
          } while (step.profitTotal < 0)
        } else {
          step.profit = step.factor * (this.ratio - 1)
          step.profitTotal = step.profit - step.total
        }
        step.total += step.factor
        return { ...step }
      })
    },
  },
}
</script>

<style lang="scss">
.trade-stepper {
  display: flex;

  .step {
    flex-basis: 30px;
    min-height: 300px;
    height: 100%;
  }

  .range,
  .short,
  .long {
    border: 1px solid;
    background-color: currentColor;
    // min-height: 60px;
    flex-grow: 1;
  }

  .range {
    color: blue;
  }

  .long {
    color: green;
  }

  .short {
    color: red;
  }
}
</style>
