import DefaultTheme from 'vitepress/theme';
import JsxLive from './components/JsxLive.vue';
import ReactPropTable from './components/ReactPropTable.vue';
import './styles.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('JsxLive', JsxLive);
    app.component('ReactPropTable', ReactPropTable);
  },
};
