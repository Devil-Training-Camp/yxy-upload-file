import { Route } from 'react-router-dom';
import Home from './components/Home';

const routes = [
  {
    path: '/',
    exact: true,
    component: Home,
  },
];

export default routes;