Vue.component('gifts-list',{
  props: ['gifts', 'index'],
    template:`<li style="align-items:center;" class="giftsBox d-flex flexLeft  animated fadeInLeft" :class="{'fadeOutLeft': gifts.active}" ref= "giftsBox" id="yourElement" v-if = "isShow">
    <div class="giftsUserImg">
      <img :src="gifts.user_info.avatar" alt="">
    </div>
    <div class="giftsUserName">
      <div>{{gifts.user_info.user_name}}</div>
      <span>送出&nbsp;{{gifts.message}}</span>
    </div>
    <div class="giftsImg">
      <img :src="gifts.goodsPic" alt="">
    </div>
  </li>`,
  data() {
    return {
      giftsInfo: {},
      active: this.gifts.active,
      isShow: true
    }
        
    },
    methods: {
      clearDom() {
        setTimeout(() => {
          this.gifts.active = 1
        },3000)
      }
    },
    mounted() {
      this.clearDom();
    }
});