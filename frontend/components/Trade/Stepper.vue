<template>
  <div class="trade-stepper">
    <div class="line top">
      <span>{{ prices.top }}</span>
    </div>
    <div class="line entry-long" :style="{ top: `${partPercent * ratio}%` }">
      <span>{{ prices.longEntry }}</span>
    </div>
    <div
      class="line entry-short"
      :style="{ bottom: `${partPercent * ratio}%` }"
    >
      <span>{{ prices.shortEntry }}</span>
    </div>
    <div class="line bottom">
      <span>{{ prices.bottom }}</span>
    </div>
    <div v-for="(step, index) in steps" :key="index" class="step">
      <div
        class="long"
        :style="stylesOrder"
        :class="{ active: isActive(index, 'buy') }"
      >
        <span v-if="isActive(index, 'buy')"> {{ step.factor * amount }}</span>
      </div>
      <div class="range" :style="stylesRange">{{ step.factor }}</div>
      <div
        class="short"
        :style="stylesOrder"
        :class="{ active: isActive(index, 'sell') }"
      >
        <span v-if="isActive(index, 'sell')"> {{ step.factor * amount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ZoneRecovery } from '../../../backend/src/models/ZoneRecovery'

export default {
  props: {
    ratio: {
      type: Number,
      default: 2,
    },
    startSide: {
      type: String,
      default: 'buy',
    },
    price: {
      type: Number,
      default: 100,
    },
    leverage: {
      type: Number,
      default: 100,
    },
    amount: {
      type: Number,
      default: 100,
    },
    maxSteps: {
      type: Number,
      default: 4,
    },
  },
  computed: {
    partPercent() {
      return 100 / (this.ratio * 2 + 1)
    },
    stylesRange() {
      return {
        height: `${this.partPercent}%`,
      }
    },
    stylesOrder() {
      return {
        height: `${this.partPercent * this.ratio}%`,
      }
    },
    steps() {
      return ZoneRecovery.calcSteps(this.maxSteps, this.ratio)
    },
    prices() {
      const prices = {
        longEntry: parseInt(this.price * (1 + this.leverage / 10000 / 2)),
        shortEntry: parseInt(this.price * (1 - this.leverage / 10000 / 2)),
      }
      prices.range = prices.longEntry - prices.shortEntry

      prices.top = prices.longEntry + prices.range * this.ratio
      prices.bottom = prices.shortEntry - prices.range * this.ratio
      return prices
    },
  },
  methods: {
    isActive(index, side) {
      if (this.startSide) {
        return side === this.startSide ? index % 2 === 0 : index % 2 !== 0
      }
      return index === 0
    },
  },
}
</script>

<style lang="scss">
.trade-stepper {
  position: relative;
  display: flex;
  padding-left: 100px;

  .line {
    position: absolute;
    width: 100px;
    left: 0;
    height: 2px;
    background-color: black;

    &.top {
      top: 0;
    }

    &.bottom {
      bottom: 0;
    }
  }

  .step {
    position: relative;
    margin-right: 10px;
    flex-basis: 40px;
    min-height: 300px;
    height: 100%;
    border: 1px solid black;
  }

  .range,
  .short,
  .long {
    position: absolute;
    width: 100%;
    border: 1px solid;
    background-color: currentColor;
    flex-grow: 1;

    &.active {
      opacity: 1;
    }
  }

  .short,
  .long {
    opacity: 0.1;

    span {
      position: absolute;
      color: black;
      font-weight: 600;
      transform: rotate(90deg);
      top: 50%;
      font-size: 20px;
      line-height: 40px;
      text-align: center;
      width: 100%;
      white-space: pre;
    }
  }

  .range {
    color: transparent;
  }

  .long {
    color: green;
    top: 0;
  }

  .short {
    color: red;
    bottom: 0;
  }
}
</style>
