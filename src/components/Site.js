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
import Agents from './pages/Agents';
import ClaimsAgent from './pages/ClaimsAgent';
import PharmacyProducts from './pages/Pharmacy/Products';
import Providers from './pages/Providers';
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
						<Route exact path="/agents">
							<Agents
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route exact path="/claims/agent">
							<ClaimsAgent
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
						<Route exact path="/providers">
							<Providers
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
