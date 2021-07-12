import React, { Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

// const Third = React.lazy(() =>
//   import(/* webpackChunkName: "second" */ './back')
// );
// const EmployeesPage = React.lazy(() =>
//   import(/* webpackChunkName: "second" */ './employees')
// );
// const UsersPage = React.lazy(() =>
//   import(/* webpackChunkName: "second" */ './Users')
// );
const ManagerPage = React.lazy(() =>
  import(/* webpackChunkName: "second" */ './manager')
);
const ThirdMenu = ({ match }) => (
  <Suspense fallback={<div className="loading" />}>
    <Switch>
      <Redirect exact from={`${match.url}/`} to={`${match.url}/manager`} />
      <Route
        path={`${match.url}/manager`}
        render={props => <ManagerPage {...props} />}
      />
      {/*
      <Route
        path={`${match.url}/back`}
        render={props => <Third {...props} />}
      />
      <Route
        path={`${match.url}/employees`}
        render={props => <EmployeesPage {...props} />}
      />
      <Route
        path={`${match.url}/users`}
        render={props => <UsersPage {...props} />}
      /> */}
      <Redirect to="/error" />
    </Switch>
  </Suspense>
);
export default ThirdMenu;
