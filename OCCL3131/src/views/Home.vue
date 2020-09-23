<template>
  <div class="home">
    <!-- <ExperienceGlasses /> -->
    <!-- <ExperienceBalls /> -->
    <!-- <ExperienceMouth /> -->
    <!-- <ExperienceGodRays /> -->
    <!-- <ExperienceFrog /> -->

    <ExperienceGlasses></ExperienceGlasses>
    <!-- <ExperienceBalls v-if="currentComponent == '1'"></ExperienceBalls> -->
    <!-- <ExperienceMouth v-if="currentComponent == '2'"></ExperienceMouth> -->
    <div class="flex_around">
      <div id="first_btn" class="effect_btn none" @click="swapComponent(0)"></div>
      <div id="second_btn" class="effect_btn none" @click="swapComponent(1)"></div>
      <div id="third_btn" class="effect_btn none" @click="swapComponent(2)"></div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import ExperienceFrog from "@/components/ExperienceFrog.vue";
import ExperienceGodRays from "@/components/ExperienceGodRays.vue";
import ExperienceGlasses from "@/components/ExperienceGlasses.vue";
import ExperienceBalls from "@/components/ExperienceBalls.vue";
import ExperienceMouth from "@/components/ExperienceMouth.vue";

import { bus } from "../main";

export default {
  name: "Home",
  data: function () {
    return {
      currentComponent: 0,
    };
  },
  components: {
    ExperienceGlasses,
    ExperienceBalls,
    ExperienceMouth,
  },
  methods: {
    swapComponent: function (component) {
      if (this.currentComponent != component) {
        this.currentComponent = component;
        bus.$emit("callChangeModel", this.currentComponent);
      }
    },
  },
};
</script>

<style lang="scss">
.home {
  @include set-size(100%, 100%);
}
.flex_around {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;

  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
.effect_btn {
  // position: absolute;
  height: 50px;
  width: 50px;
  // bottom: 50px;
  padding: 0px;
  margin: 0px 10px 20px 10px;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  border: none;
  z-index: 100;
}
.effect_btn:hover {
  cursor: pointer;
}
.none {
  display: none;
}
.show {
  display: block;
}
#first_btn {
  background-image: url("../assets/Buttons/2.png");
}
#second_btn {
  background-image: url("../assets/Buttons/1.png");
}
#third_btn {
  background-image: url("../assets/Buttons/3.png");
}
</style>
