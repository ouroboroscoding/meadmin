/**
 * Permissions
 *
 * Handles permissions associated with a Provider
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-15
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

// Shared generic modules
import { clone } from 'shared/generic/tools';

// defines
const CREATE = 4;
const READ   = 1;
const UPDATE = 2;
const DELETE = 8;
const ALL    = 15;
const TYPES = [
	{title: "Provider Tool", rights: [
		{name: "order_claims", title: "Order Claims", allowed: UPDATE | CREATE | DELETE},
		{name: "prov_overwrite", title: "Order Claim Overwrite", allowed: CREATE},
		{name: "prov_templates", title: "Templates: Ability to create and modify templates", allowed: ALL}
	]},
	{title: "CRM", rights: [
		{name: "customers", title: "CRM Customers", allowed: READ},
		{name: "orders", title: "CRM Orders", allowed: READ | UPDATE}
	]},
	{title: "Memo", rights: [
		{name: "calendly", title: "Calendly Appointment", allowed: READ},
		{name: "memo_mips", title: "Memo MIP", allowed: READ | UPDATE},
		{name: "memo_notes", title: "Memo Notes", allowed: READ | CREATE}
	]},
	{title: "Pharmacy", rights: [
		{name: "prescriptions", title: "Prescriptions", allowed: CREATE | READ | UPDATE},
		{name: "rx_diagnosis", title: "ICD to DoseSpot Diagnosis", allowed: READ},
		{name: "rx_product", title: "Product to NDC", allowed: ALL},
		{name: "medications", title: "Medications", "allowed": READ}
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
