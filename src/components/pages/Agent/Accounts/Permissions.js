/**
 * Permissions
 *
 * Handles permissions associated with an Agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-08
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

// defines
const CREATE = 4;
const READ   = 1;
const UPDATE = 2;
const DELETE = 8;
const ALL    = 15;
const TYPES = [
	{title: "Calendly", rights: [
		{name: "calendly", title: "Appointments", allowed: READ},
		{name: "calendly_admin", title: "Events", allowed: READ}
	]},
	{title: "Customer Service", rights: [
		{name: "csr_agents", title: "Agents: Ability to manage agents and permissions", allowed: ALL},
		{name: "csr_claims", title: "Claims", allowed: CREATE | UPDATE | DELETE},
		{name: "csr_overwrite", title: "Claim Overwrite", allowed: CREATE | READ},
		{name: "csr_claims_provider", title: "Transfer to Provider", allowed: CREATE},
		{name: "csr_messaging", title: "Messaging", allowed: CREATE | READ},
		{name: "csr_templates", title: "Templates: Ability to create and modify templates", allowed: ALL},
		{name: "csr_stats", title: "Stats: Allowed to view stats", allowed: READ},
		{name: "justcall", title: "JustCall", allowed: READ},
		{name: "hubspot", title: "HubSpot", allowed: READ},
		{name: "everify", title: "E-Verification", allowed: READ | UPDATE},
		{name: "csr_leads", title: "Leads", allowed: READ}
	]},
	{title: "CRM", rights: [
		{name: "campaigns", title: "Campaigns", allowed: READ},
		{name: "customers", title: "Customers", allowed: READ | UPDATE},
		{name: "orders", title: "Orders", allowed: CREATE | READ | UPDATE},
		{name: "products", title: "Products", allowed: READ}
	]},
	{title: "Patient Portal", rights: [
		{name: "patient_account", title: "Account", allowed: CREATE | READ | UPDATE}
	]},
	{title: "Memo", rights: [
		{name: "memo_mips", title: "Memo MIP", allowed: READ | UPDATE},
		{name: "memo_notes", title: "Memo Notes", allowed: READ | CREATE}
	]},
	{title: "Pharmacy", rights: [
		{name: "prescriptions", title: "Prescriptions", allowed: CREATE | READ | UPDATE},
		{name: "pharmacy_fill", title: "Pharmacy Fill", allowed: ALL},
		{name: "rx_diagnosis", title: "ICD to DoseSpot Diagnosis", allowed: READ},
		{name: "rx_hrt_order", title: "HRT Prescriptions", allowed: READ | UPDATE},
		{name: "rx_products", title: "DoseSpot medications", allowed: READ},
		{name: "welldyne_adhoc", title: "Adhoc", allowed: CREATE | READ | DELETE},
		{name: "welldyne_never_started", title: "Never Started", allowed: READ | UPDATE | DELETE},
		{name: "welldyne_outbound", title: "Outbound Failed", allowed: READ | UPDATE}
	]}
];

/**
 * Permission
 *
 * Handles a single permission
 *
 * @name Permission
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function Permission(props) {

	function change(event) {

		// Get the bit
		let bit = event.currentTarget.dataset.bit;

		// Combine it with the current value and let the parent know
		props.onChange(props.name, props.value ^ bit);
	}

	return (
		<React.Fragment>
			<Grid item xs={4} className="name">{props.title}</Grid>
			{[CREATE, READ, UPDATE, DELETE].map(bit =>
				<Grid key={bit} item xs={2}>
					{props.allowed & bit ?
						<Switch
							checked={props.value & bit ? true : false}
							onChange={change}
							color="primary"
							inputProps={{
								"aria-label": 'primary checkbox',
								"data-bit": bit
							}}
						/>
					:
						''
					}
				</Grid>
			)}
		</React.Fragment>
	);
}

// Force props
Permission.propTypes = {
	"allowed": PropTypes.number.isRequired,
	"onChange": PropTypes.func.isRequired,
	"name": PropTypes.string.isRequired,
	"title": PropTypes.string.isRequired,
	"value": PropTypes.number.isRequired
}

/**
 * Permissions
 *
 * Handles permissions for a single agent
 *
 * @name Permissions
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Permissions(props) {

	// State
	let [permissions, permissionsSet] = useState(false);

	// Load effect
	useEffect(() => {

		// Fetch the agent's permissions
		Rest.read('csr', 'agent/permissions', {
			agent_id: props.value._id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the permissions
				permissionsSet(res.data);
			}
		});
	}, [props.value]);

	// Called when any permission is changed
	function change(name, rights) {

		// Clone the current values
		let oPermissions = clone(permissions);

		// If there are rights
		if(rights) {

			// Update the specific permission
			if(oPermissions[name]) {
				oPermissions[name].rights = rights;
			} else {
				oPermissions[name] = {"rights": rights, "idents": null};
			}
		}

		// Else, remove the right
		else {
			delete oPermissions[name];
		}

		// Update the state
		permissionsSet(oPermissions);
	}

	// Called to update permissions
	function update() {

		// Update the agent's permissions
		Rest.update('csr', 'agent/permissions', {
			agent_id: props.value._id,
			permissions: permissions
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Notify success
				Events.trigger('success', 'Permissions updated');

				// Let parent know to close
				props.onClose();
			}
		});
	}

	// Render
	return (
		<React.Fragment>
			{TYPES.map(section =>
				<Paper key={section.title} className="permissions">
					<Grid container spacing={2}>
						<Grid item xs={4} className="title">{section.title}</Grid>
						<Grid item xs={2} className="title">Create</Grid>
						<Grid item xs={2} className="title">Read</Grid>
						<Grid item xs={2} className="title">Update</Grid>
						<Grid item xs={2} className="title">Delete</Grid>
						{section.rights.map(perm =>
							<Permission
								allowed={perm.allowed}
								key={perm.name}
								name={perm.name}
								onChange={change}
								title={perm.title}
								value={permissions[perm.name] ? permissions[perm.name].rights : 0}
							/>
						)}
					</Grid>
				</Paper>
			)}
			<Box className="actions">
				<Button variant="contained" color="secondary" onClick={props.onClose}>Cancel</Button>
				<Button variant="contained" color="primary" onClick={update}>Update</Button>
			</Box>
		</React.Fragment>
	);
}

// Force props
Permissions.propTypes = {
	onClose: PropTypes.func.isRequired,
	value: PropTypes.object.isRequired
}
