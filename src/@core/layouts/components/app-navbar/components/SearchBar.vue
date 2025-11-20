<template>
  <li class="nav-item nav-search customizer-li">
    <!-- Icon -->
    <!-- <a
      href="javascript:void(0)"
      class="nav-link nav-link-search d-xs-block d-sm-block d-md-block d-lg-block d-xl-none"
      @click="showSearchBar = true"
    >
      <feather-icon icon="SearchIcon" size="21" class="customizer-icon" />
    </a> -->

    <!-- Input -->
    <!-- <div>
      <b-input-group>
        <template #prepend>
          <b-input-group-text>
            <div class="search-input-icon customizer-search-icon">
              <feather-icon icon="SearchIcon" />
            </div>
          </b-input-group-text>
        </template>
        <b-form-input
          v-if="showSearchBar"
          v-model="searchQuery"
          placeholder="Search Height/Transaction/Address/Schema code"
          autofocus
          autocomplete="off"
          @keyup.enter="doQuery"
          @keyup.esc="escPressed"
        />

        <template #append>
          <b-dropdown
            :text="selectedItem"
            variant="primary"
            v-model="selectedItem"
          >
            <b-dropdown-item
              id="Height"
              @click="selectedItem = 'Height'"
              class="text-dropdown"
            >
              Height
            </b-dropdown-item>
            <b-dropdown-item
              id="Transaction"
              @click="selectedItem = 'Transaction'"
            >
              Transaction
            </b-dropdown-item>
            <b-dropdown-item id="Address" @click="selectedItem = 'Address'">
              Address
            </b-dropdown-item>
            <b-dropdown-item
              id="Schema code"
              @click="selectedItem = 'Schema code'"
            >
              Schema code
            </b-dropdown-item>
          </b-dropdown>
        </template>
      </b-input-group>
    </div> -->
    <div
      class="search-input customizer-search my-50"
      :class="{ open: showSearchBar }"
    >
      <div class="search-input-icon customizer-search-icon">
        <feather-icon icon="SearchIcon" />
      </div>

      <b-form-input
        v-if="showSearchBar"
        v-model="searchQuery"
        placeholder="Search Height/Transaction/Address/SchemaCode/Contract"
        class="customizer-input"
        autofocus
        autocomplete="off"
        @keyup="optionSearch"
        @keyup.enter="doQuery"
      />

      <ul v-if="filterData.length > 1" class="suggestion-list">
        <li
          v-for="(item, index) in filterData"
          :key="index"
          :value="index"
          class="cursor-pointer"
          @click="doQuery(item.name)"
        >
          <span v-if="item.contract !== undefined && item.contract !== ''">
            Contract: {{ item.contract }}
          </span>
          <div>
            <span> {{ item.type }} </span>-
            <span>
              {{ item.name }}
            </span>
          </div>
        </li>
      </ul>
    </div>

    <!-- <div class="mt-2 style-search">
      <div v-for="search in filteredSearch" :key="search" class="p-50">
        <div class="col-4 text-dark">
          <h6>{{ search.title }}</h6>
        </div>
        <div class="col text-secondary">{{ search.text }}</div>
      </div>
    </div> -->
  </li>
</template>

<script>
import { BFormInput } from 'bootstrap-vue';
import { ref } from '@vue/composition-api';
import { title } from '@core/utils/filter';
import store from '@/store';

export default {
  components: {
    BFormInput
  },
  // props: {
  //   initialOptions: [
  //     { type: 'height', name: '' },
  //     { type: 'txhash', name: '' },
  //     { type: 'addr', name: '' },
  //     { type: 'operaddr', name: '' },
  //     { type: 'schema', name: '' },
  //     { type: 'contract', name: '' }
  //   ]
  // },
  setup() {
    const showSearchBar = ref(true);

    const perfectScrollbarSettings = {
      maxScrollbarLength: 60
    };

    return {
      showSearchBar,
      perfectScrollbarSettings,
      title
    };
  },
  data() {
    return {
      searchQuery: '',
      searchValue: '',
      searchList: [
        { title: 'Hight', text: 'Whatever it takes' },
        { title: 'Transaction', text: 'I am still worthy' },
        {
          title: 'Address',
          text: 'I dont judge people by their worst mistakes'
        },
        { title: 'Schema code', text: 'I am… inevitable' }
      ],
      options: [
        { type: 'height', name: '' },
        { type: 'txhash', name: '' },
        { type: 'addr', name: '' },
        { type: 'operaddr', name: '' },
        { type: 'schema', name: '' },
        { type: 'contract', name: '' }
      ]
    };
  },
  methods: {
    doSomething(v) {
    },
    optionSearch: async function(e) {
      this.options = [
        { type: 'height', name: '' },
        { type: 'txhash', name: '' },
        { type: 'addr', name: '' },
        { type: 'operaddr', name: '' },
        { type: 'schema', name: '' },
        { type: 'contract', name: '' }
      ];
      const height = /^\d+$/;
      const txhash = /^[A-Z\d]{64}$/;
      const addr = /^[a-z\d]{2,6}1[a-z\d]{38}$/;
      const operaddr = /^[a-z\d]{2,6}1[a-z\d]{45}$/;
      const contract = /^[\d]x[a-zA-Z0-9]{40}$/;
      const schema = /^[a-z-.]+/;
      const key = e.target.value;

      if (key !== '') {
        if (height.test(key)) {
          this.options
            .filter(item => item.type === 'height')
            .forEach(item => (item.name = key));
        } else if (txhash.test(key)) {
          this.options
            .filter(item => item.type === 'txhash')
            .forEach(item => (item.name = key));
        } else if (addr.test(key)) {
          this.options
            .filter(item => item.type === 'addr')
            .forEach(item => (item.name = key));
        } else if (operaddr.test(key)) {
          this.options
            .filter(item => item.type === 'operaddr')
            .forEach(item => (item.name = key));
        } else if (schema.test(key)) {
          this.options
            .filter(item => item.type === 'schema')
            .forEach(item => (item.name = key));
        } else if (contract.test(key)) {
          const data = await this.$http
            .getSchemaNameByContract(key)
            .then(res => {
              if (res.nFTSchemaByContract !== undefined) {
                return res.nFTSchemaByContract.schemaCodes;
              } else {
                return [];
              }
            });

          if (data.length > 0) {
            this.options = [];
            data.map((r, i) => {
              this.options.push({ type: 'schema', name: r, contract: key });
            });
          } else {
            this.options
              .filter(item => item.type === 'contract')
              .forEach(item => (item.name = key));
          }
        } else {
          this.options
            .filter(item => item.type)
            .forEach(item => (item.name = ''));
        }
      } else {
        this.options
          .filter(item => item.type)
          .forEach(item => (item.name = ''));
      }
    },
    doQuery: async function(k) {
      const height = /^\d+$/;
      const txhash = /^[A-Z\d]{64}$/;
      const addr = /^[a-z\d]{2,6}1[a-z\d]{38}$/;
      const operaddr = /^[a-z\d]{2,6}1[a-z\d]{45}$/;
      const contract = /^[\d]x[a-zA-Z0-9]{40}$/;
      const schema = /^[a-z-.]+/;
      const key = k.constructor.name === 'String' ? k : this.searchQuery;

      const c = store.state.chains.selected;
      if (!Object.values(this.$route.params).includes(key)) {
        this.searchQuery = key;
        if (height.test(key)) {
          this.$router.push({
            name: 'block',
            params: { chain: c.chain_name, height: key }
          });
        } else if (txhash.test(key)) {
          this.$router.push({
            name: 'transaction',
            params: { chain: c.chain_name, hash: key }
          });
        } else if (addr.test(key)) {
          this.$router.push({
            name: 'chain-account',
            params: { chain: c.chain_name, address: key }
          });
        } else if (operaddr.test(key)) {
          this.$router.push({
            name: 'chain-account',
            params: { chain: c.chain_name, address: key }
          });
        } else if (schema.test(key)) {
          this.$router.push({
            name: 'gen2TxnSeach',
            params: { chain: c.chain_name, tokenCode: key, contract: '' }
          });
        } else if (contract.test(key)) {
          const data = await this.$http
            .getSchemaNameByContract(key)
            .then(res => {
              if (res.nFTSchemaByContract !== undefined) {
                return res.nFTSchemaByContract.schemaCodes;
              } else {
                return [];
              }
            });

          if (data.length > 1) {
            this.options = [];
            data.map((r, i) => {
              this.options.push({ type: 'schema', name: r, contract: key });
            });
          } else {
            this.$router.push({
              name: 'gen2TxnSeach',
              params: { chain: c.chain_name, tokenCode: data[0], contract: '' }
            });
          }
        }
      }
      this.options.filter(item => item.type).forEach(item => (item.name = ''));
      // this.$router.push('/')
    },
    async initial() {
      this.$http.getSchemaNameByContract(contractAddress).then(res => {});
    }
  },
  computed: {
    filteredSearch() {
      return this.searchList.filter(search => {
        return (
          search.title.toLowerCase().includes(this.searchValue.toLowerCase()) ||
          search.text.toLowerCase().includes(this.searchValue.toLowerCase())
        );
      });
    },
    filterData() {
      return this.options.filter(v => v.name !== '');
    }
  }
};
</script>

<style lang="scss" scoped>
@import '~@core/scss/base/bootstrap-extended/include';
@import '~@core/scss/base/components/variables-dark';

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
p {
  margin: 0;
}

/* .app-auto-suggest {
  position: relative;
}

.auto-suggest-suggestions-list {
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  border-radius: 6px;
  position: absolute;
  top: calc(100% + 1rem);
  background-color: white;
  width: 100%;
} */

.suggestion-group-title {
  font-weight: 500;
  padding: 0.75rem 1rem 0.25rem;
}

.suggestion-group-suggestion {
  padding: 0.75rem 1rem;
}

.suggestion-current-selected {
  background-color: $body-bg;

  .dark-layout & {
    background-color: $theme-dark-body-bg;
  }
}

.customizer-icon {
  color: $info;

  .dark-layout & {
    color: $primary;
  }
}

.customizer-search-icon {
  top: 22% !important;
}
.customizer-li {
  width: 40%;
  @include media-breakpoint-only(sm) {
    width: 65%;
  }
  @include media-breakpoint-down(xs) {
    width: 100%;
  }
}

.customizer-input {
  padding: 1rem 3.6rem !important;
}

.customizer-search {
  position: relative !important;
}

.bg-dropdown {
  background: $info;
  color: #fff;
}

.text-dropdown {
  color: #fff;

  .dark-layout & {
    color: $primary;
  }
}

.style-search {
  border: 1px solid $white;
  border-radius: 12px;
  cursor: pointer;
}

.suggestion-list {
  // background-color: #002770;
  background-color: $info;
  color: #fff;
  // border: 1px solid #ddd;
  list-style: none;
  display: block;
  margin: 0;
  padding: 10px;
  width: 100%;
  overflow: hidden;
  position: absolute;
  border-radius: 0.357rem;
  // top: 20px;
  left: 0;
  z-index: 2;

  li {
    line-height: 26px !important;
  }

  .dark-layout & {
    background-color: $primary;
  }
}
</style>
