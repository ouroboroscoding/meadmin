/**
 * Site
 *
 * Primary entry into React app
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-24
 */

// NPM modules
import React, { useState } from 'react';
import { Switch, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import Hash from 'shared/generic/hash';

// Shared hooks
import { useEvent } from 'shared/hooks/event';
import { useResize } from 'shared/hooks/resize';

// Site component modules
import Alerts from './Alerts';
import Header from './Header';
import { LoaderHide, LoaderShow } from './Loader';
import SignIn from './SignIn';

// Page component modules
import AgentAccounts from './pages/Agent/Accounts';
import AgentClaims from './pages/Agent/Claims';
import CalendlyEvents from './pages/Calendly/Events';
import DocsServices from './pages/Documentation/Services';
import DocsErrors from './pages/Documentation/Errors';
import Links from './pages/Links';
import PharmacyProducts from './pages/Pharmacy/Products';
import ProviderAccounts from './pages/Provider/Accounts';
import ProviderClaims from './pages/Provider/Claims';
import ProviderStats from './pages/Provider/Stats';
import ReportRecipients from './pages/ReportRecipients';
import Users from './pages/Users';

// CSS
import 'sass/site.scss';

// Init the rest services
Rest.init(process.env.REACT_APP_MEMS_DOMAIN, process.env.REACT_APP_MEMS_DOMAIN, xhr => {

	// If we got a 401, let everyone know we signed out
	if(xhr.status === 401) {
		Events.trigger('error', 'You have been signed out!');
		Events.trigger('signedOut');
	} else {
		Events.trigger('error',
			'Unable to connect to ' + process.env.REACT_APP_MEMS_DOMAIN +
			': ' + xhr.statusText +
			' (' + xhr.status + ')');
	}
}, (method, url, data, opts) => {
	LoaderShow();
}, (method, url, data, opts) => {
	LoaderHide();
});

// If we have a session, fetch the user
if(Rest.session()) {
	Rest.read('auth', 'session', {}).done(res => {
		Rest.read('auth', 'user', {}).done(res => {
			Events.trigger('signedIn', res.data);
		});
	});
}

// Init the hash
Hash.init();

// Hide the loader
LoaderHide();

// Site
export default function Site(props) {

	// State
	let [mobile, mobileSet] = useState(document.documentElement.clientWidth < 600 ? true : false);
	let [user, userSet] = useState(false);

	// hooks
	useEvent('signedIn', user => userSet(user));
	useEvent('signedOut', () => userSet(false));

	// Resize hooks
	useResize(() => mobileSet(document.documentElement.clientWidth < 600 ? true : false));

	// Render
	return (
		<SnackbarProvider maxSnack={3}>
			<Alerts />
			<div id="site">
				{user === false &&
					<SignIn />
				}
				<Header
					mobile={mobile}
					user={user}
				/>
				<div id="content">
					<Switch>
						<Route exact path="/agent/accounts">
							<AgentAccounts
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/agent/claims">
							<AgentClaims
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/calendly/events">
							<CalendlyEvents
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/documentation/services">
							<DocsServices
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/documentation/errors">
							<DocsErrors
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/links">
							<Links
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/pharmacy/products">
							<PharmacyProducts
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/provider/accounts">
							<ProviderAccounts
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/provider/claims">
							<ProviderClaims
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/provider/stats">
							<ProviderStats
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/reports">
							<ReportRecipients
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/users">
							<Users
								mobile={mobile}
								user={user}
							/>
						</Route>
					</Switch>
				</div>
			</div>
		</SnackbarProvider>
	);
}
