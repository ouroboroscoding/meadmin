/**
 * Permissions
 *
 * Handles permissions associated with a User
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-21
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

// Generic modules
import { clone } from 'shared/generic/tools';

// defines
const CREATE = 4;
const READ   = 1;
const UPDATE = 2;
const DELETE = 8;
const ALL    = 15;
const TYPES = [
	{title: "Auth", rights: [
		{name: "user", title: "Users", allowed: CREATE | READ | UPDATE},
		{name: "permission", title: "User Rights", allowed: READ | UPDATE}
	]},
	{title: "Calendly", rights: [
		{name: "calendly", title: "Appointments", allowed: READ},
		{name: "calendly_admin", title: "Events", allowed: ALL}
	]},
	{title: "CRM", rights: [
		{name: "customers", title: "Customers", allowed: CREATE | READ | UPDATE}
	]},
	{title: "Customer Support", rights: [
		{name: "csr_agents", title: "Agents", allowed: ALL},
		{name: "csr_claims", title: "Claims", allowed: CREATE | UPDATE | DELETE},
		{name: "csr_overwrite", title: "Overwrite/Delete Claims", allowed: CREATE | READ | DELETE},
		{name: "csr_messaging", title: "Messaging", allowed: CREATE | READ},
		{name: "csr_stats", title: "Stats", allowed: READ},
		{name: "csr_templates", title: "Templates", allowed: ALL},
		{name: "justcall", title: "JustCall", allowed: READ},
		{name: "hubspot", title: "HubSpot", allowed: READ}
	]},
	{title: "Developers", rights: [
		{name: "documentation", title: "Documentation", allowed: CREATE | UPDATE | DELETE}
	]},
	{title: "General", rights: [
		{name: "link", title: "Link Shortening", allowed: CREATE | DELETE | READ}
	]},
	{title: "Patient", rights: [
		{name: "patient_account", title: "Patient", allowed: CREATE | READ | UPDATE},
		{name: "prescriptions", title: "Prescriptions", allowed: READ | UPDATE},
		{name: "medications", title: "Medication History", allowed: READ},
	]},
	{title: "Providers", rights: [
		{name: "providers", title: "Providers", allowed: CREATE | READ | UPDATE},
		{name: "prov_claims", title: "Claims", allowed: CREATE | UPDATE | DELETE},
		{name: "prov_overwrite", title: "Overwrite Claims", allowed: CREATE},
		{name: "prov_stats", title: "Hours / Stats", allowed: READ},
		{name: "prov_templates", title: "Templates", allowed: ALL}
	]},
	{title: "Memo", rights: [
		{name: "memo_mips", title: "MIP", allowed: READ | UPDATE},
		{name: "memo_notes", title: "Notes", allowed: READ | CREATE}
	]},
	{title: "Pharmacy", rights: [
		{name: "pharmacy_fill", title: "Pharmacy Fill", allowed: ALL},
		{name: "rx_product", title: "Product to NDC", allowed: ALL},
		{name: "manual_adhoc", title: "WellDyne Manual AdHoc", allowed: ALL},
		{name: "welldyne_adhoc", title: "WellDyneRX AdHoc", allowed: CREATE | READ | DELETE},
		{name: "welldyne_outbound", title: "WellDyneRX Outbound", allowed: READ | UPDATE}
	]},
	{title: "Reporting", rights: [
		{name: "report_recipients", title: "Recipients", allowed: ALL}
	]}
];

// Permission
function Permission(props) {

	function rightChange(event) {

		// Get the bit
		let bit = event.currentTarget.dataset.bit;

		// Combine it with the current rights and let the parent know
		props.onChange(props.name, 'right', props.value.rights ^ bit);
	}

	function identChange(event) {
		props.onChange(props.name, 'ident', event.currentTarget.value.trim());
	}

	return (
		<React.Fragment>
			<Grid item xs={2} className="name">{props.title}</Grid>
			{[CREATE, READ, UPDATE, DELETE].map(bit =>
				<Grid key={bit} item xs={2}>
					{props.allowed & bit ?
						<Switch
							checked={props.value.rights & bit ? true : false}
							onChange={rightChange}
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
			<Grid item xs={2}>
				{props.value.rights !== 0 &&
					<TextField type="text" onChange={identChange} value={props.value.idents || ''} />
				}
			</Grid>
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

// Permissions
export default class Permissions extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Initial state
		this.state = {
			"value": props.value
		}

		// Bind methods
		this.change = this.change.bind(this);
	}

	change(name, type, val) {

		// Clone the current values
		let value = clone(this.state.value);

		// If we don't have the name yet
		if(!value[name]) {
			value[name] = {
				rights: 0,
				idents: null
			}
		}

		// If we're changing the rights
		if(type === 'right') {

			// If there are rights or previous idents
			if(val) {
				value[name].rights = val;
			}

			// Else, remove the permission
			else {
				delete value[name];
			}
		}

		// Else if we're changing the ident
		if(type === 'ident') {

			// If it's empty, make it null
			if(val === '') {
				val = null;
			}

			// Set the ident
			value[name].idents = val.split(',');
		}

		// Update the state
		this.setState({value: value});
	}

	render() {
		return TYPES.map(section =>
			<Paper key={section.title} className="permissions">
				<Grid container spacing={2}>
					<Grid item xs={2} className="title">{section.title}</Grid>
					<Grid item xs={2} className="title">Create</Grid>
					<Grid item xs={2} className="title">Read</Grid>
					<Grid item xs={2} className="title">Update</Grid>
					<Grid item xs={2} className="title">Delete</Grid>
					<Grid item xs={2} className="title">Idents (Optional)</Grid>
					{section.rights.map(perm =>
						<Permission
							allowed={perm.allowed}
							key={perm.name}
							name={perm.name}
							onChange={this.change}
							title={perm.title}
							value={this.state.value[perm.name] || {rights: 0, idents: null}}
						/>
					)}
				</Grid>
			</Paper>
		);
	}

	get value() {
		return this.state.value;
	}
}

// Force props
Permissions.propTypes = {
	"value": PropTypes.object
}

// Default props
Permissions.defaultTypes = {
	"value": {}
}
