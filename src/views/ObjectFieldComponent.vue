<template>
  <b-table-simple
    v-if="typeof tablefield === 'object' && tablefield !== null && Object.keys(tablefield || {}).length > 0"
    hover
    :small="small"
    striped
    stacked="sm"
    responsive="sm"
  >
    <b-tbody>
      <b-tr v-for="(value, name) in tablefield" :key="name">
        <b-td style="text-transform: capitalize; vertical-align: top;">
          {{ name.replaceAll('_', ' ') }}
        </b-td>
        <b-td v-if="isTokenField(value)">
          {{ formatTokens(value) }}
        </b-td>
        <b-td v-else-if="isArrayText(value)">
          {{ value.join(', ') }}
        </b-td>
        <b-td v-else-if="isHex(value)">
          {{ formatHexAddress(value) }}
        </b-td>
        <b-td v-else-if="Array.isArray(value)">
          <array-field-component :tablefield="value" />
        </b-td>
        <b-td
          v-else-if="typeof value === 'object'"
          hover
          class="overflow-hidden"
        >
          <b-tabs v-if="value" small>
            <b-tab
              v-for="key in Object.keys(value)"
              :key="key"
              :title="key"
              class="pl-0 pr-0"
              title-item-class="bg-light-primary"
              style="padding: 0px;"
            >
              <array-field-component
                v-if="Array.isArray(value[key])"
                :tablefield="value[key]"
              />
              <object-field-component
                v-else-if="typeof value[key] === 'object'"
                :tablefield="value[key]"
              />
              <object-field-component
                v-else-if="isObjectText(value[key])"
                :tablefield="toObject(value[key])"
              />
              <span v-else>{{ value[key] }}</span>
            </b-tab>
          </b-tabs>
        </b-td>
        <b-td v-else-if="/^6x1[a-z\d]{38}$/.test(value)">
          <router-link :to="`../account/${value}`">
            {{ addNewLine(value) }}
          </router-link>
        </b-td>
        <b-td v-else class="text-capitalize">
          {{
            addNewLine(value) === '/cosmos.bank.v1beta1.MsgSend'
              ? tablefield['to_address'] === address
                ? 'Receive'
                : 'Send'
              : addNewLine(value)
          }}
        </b-td>
      </b-tr>
    </b-tbody>
  </b-table-simple>
</template>

<script>
import { BTableSimple, BTr, BTd, BTabs, BTab, BTbody } from 'bootstrap-vue';
import {
  abbr,
  getStakingValidatorByHex,
  isHexAddress,
  isStringArray,
  isToken,
  percent,
  tokenFormatter
} from '@/libs/utils';
import ArrayFieldComponent from './ArrayFieldComponent.vue';
import { codeMessage } from '@/constants/module';

export default {
  name: 'ObjectFieldComponent',
  components: {
    BTableSimple,
    BTr,
    BTd,
    BTabs,
    BTab,
    BTbody,
    ArrayFieldComponent
  },
  data() {
    return {
      address: ''
    };
  },
  props: {
    tablefield: {
      type: [Array, Object],
      default: () => {}
    },
    small: {
      type: Boolean,
      default: true
    }
  },
  created() {
    const { address } = this.$route.params;
    this.address = address;
  },
  methods: {
    formatObject(value) {
      // if (typeof (value) === 'object' && Object.keys(value).length === 1) {
      //   return value[Object.keys(value)[0]]
      // }
      return value;
    },
    isObjectText(v) {
      return String(v).startsWith('{') && String(v).endsWith('}');
    },
    toObject(v) {
      return JSON.parse(v);
    },
    formatText: v => abbr(v, 60),
    eval_value(value) {
      return Array.from(value);
    },
    isTokenField(value) {
      return isToken(value);
    },
    isHex(value) {
      return isHexAddress(value);
    },
    formatHexAddress(v) {
      const denom = v.denom === 'usix' ? 'six' : v.denom;
      const amount = parseInt(v.amount) / Math.pow(10, 6);
      return getStakingValidatorByHex(denom, amount);
      // return getStakingValidatorByHex(this.$http.config.chain_name, v);
    },
    isArrayText(value) {
      return isStringArray(value);
    },
    formatTokens(value) {
      return tokenFormatter(value);
    },
    addNewLine(value) {
      const percentage = /^0\.\d+/;

      if (percentage.test(value)) {
        return `${percent(value)}%`;
      }
      if (typeof value === 'string' && value.indexOf('\\n') > -1) {
        return value.replaceAll('\\n', '\n');
      }

      if (value.toString().split('.').length > 1) {
        if (
          value
            .toString()
            .split('.')
            .slice(-1)[0] === 'MsgSend'
        ) {
          return value.replaceAll('\\n', '\n');
        } else {
          if (typeof codeMessage[value.split('.').slice(-1)] !== 'undefined') {
            return codeMessage[
              value
                .toString()
                .split('.')
                .slice(-1)[0]
            ].message;
          } else {
            return value.replaceAll('\\n', '\n');
          }
        }
      }

      return value;
    }
  }
};
</script>

<style lang="css" scoped>
@media (min-width: 768px) {
  td:first-child {
    width: 20%;
  }
}
</style>
