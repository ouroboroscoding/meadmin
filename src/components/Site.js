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

// Shared generic modules
import Hash from 'shared/generic/hash';

// Shared hooks
import { useEvent } from 'shared/hooks/event';
import { useResize } from 'shared/hooks/resize';

// Site component modules
import Alerts from './Alerts';
import Header from './Header';
import SignIn from './SignIn';

// Page component modules
import AgentAccounts from './pages/Agent/Accounts';
import AgentClaims from './pages/Agent/Claims';
import AgentTickets from './pages/Agent/Tickets';
import CalendlyEvents from './pages/Calendly/Events';
import DocsServices from './pages/Documentation/Services';
import DocsErrors from './pages/Documentation/Errors';
import Links from './pages/Links';
import PharmacyProducts from './pages/Pharmacy/Products';
import ProviderAccounts from './pages/Provider/Accounts';
import ProviderClaims from './pages/Provider/Claims';
import ProviderPending from './pages/Provider/Pending';
import ProviderStats from './pages/Provider/Stats';
import ReportRecipients from './pages/ReportRecipients';
import SMSTemplates from './pages/SMSTemplates';
import Users from './pages/Users';

// CSS
import 'sass/site.scss';

// Rest Init
import 'rest_init';

// Init the hash
Hash.init();

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
			<div id="site" className="flexRows">
				<Header
					mobile={mobile}
					user={user}
				/>
				{user === false ?
					<SignIn />
				:
					<div id="content" className="flexGrow flexRows">
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
							<Route exact path="/agent/tickets">
								<AgentTickets
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
							<Route exact path="/provider/pending">
								<ProviderPending
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
							<Route exact path="/smstemplates">
								<SMSTemplates
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
				}
			</div>
		</SnackbarProvider>
	);
}
