/**
 * SMS Templates
 *
 * Allows users to update the content of SMS templates
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-07-03
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI icons
import EditIcon from '@material-ui/icons/Edit';
import SaveIcon from '@material-ui/icons/Save';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, omap } from 'shared/generic/tools';

// Constants
const _TAB_NAMES = {
	async_1: 'ED Async',
	av_1: 'ED Audio/Visual',
	email_4: 'HRT Email',
	sms_0: 'Expiring Prescription',
	sms_4: 'HRT Workflow'
};

/**
 * Template
 *
 * Manages a single template as a tablr row
 *
 * @name Templates
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Template(props) {

	// State
	let [edit, editSet] = useState(false);

	// Refs
	let refContent = useRef();

	// Save/Update
	function update() {

		// If the content is empty
		if(refContent.current.value.trim() === '') {
			Events.trigger('error', 'Content of template can not be empty');
			return;
		}

		// If the content hasn't changed
		if(props.value.content === refContent.current.value) {
			editSet(false);
			return;
		}

		// Store the data for the request and the onUpdate
		let oData = {
			id: props.value.id,
			content: refContent.current.value
		};

		// Save the new content
		Rest.update('monolith', 'template/sms', oData).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				props.onUpdate(oData);
				editSet(false);
				Events.trigger('success', 'Template saved');
			}
		});
	}

	// Render
	return (
		<TableRow>
			<TableCell>{props.value.title}</TableCell>
			<TableCell>
				{edit ?
					<TextField
						defaultValue={props.value.content}
						multiline
						inputRef={refContent}
					/>
				:
					props.value.content.split('\n').map((s,i) =>
						<Typography key={i}>{s}</Typography>
					)
				}
			</TableCell>
			<TableCell className="actions">
				{edit ?
					<Tooltip title="Save template changes">
						<IconButton className="icon" onClick={update}>
							<SaveIcon />
						</IconButton>
					</Tooltip>
				:
					<Tooltip title="Edit the template">
						<IconButton className="icon" onClick={ev => editSet(true)}>
							<EditIcon />
						</IconButton>
					</Tooltip>
				}
			</TableCell>
		</TableRow>
	);
}

// Valid props
Template.propTypes = {
	allowEdit: PropTypes.bool,
	onUpdate: PropTypes.func.isRequired,
	value: PropTypes.object.isRequired
}

// Default props
Template.defaultProps = {
	allowEdit: false
}

/**
 * SMS Templates
 *
 * The component
 *
 * @name SMSTemplates
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function SMSTemplates(props) {

	// State
	let [tpls, tplsSet] = useState(null);
	let [tab, tabSet] = useState(0);
	let [type, typeSet] = useState(null);

	// User effect
	useEffect(() => {

		if(props.user && Rights.has('sms_workflow', 'update')) {

			// Fetch the templates
			Rest.read('monolith', 'template/sms', {}).done(res => {

				// If there's an error or warning
				if(res.error && !res._handled) {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
				if(res.warning) {
					Events.trigger('warning', JSON.stringify(res.warning));
				}

				// If there's data, store it
				if(res.data) {
					tplsSet(res.data);
				}
			});
		} else {
			tplsSet(-1);
		}

	}, [props.user]);

	// Tab effect
	useEffect(() => {

		// If we have templates
		if(tpls) {

			console.log(tab);
			console.log(Object.keys(tpls));

			typeSet(Object.keys(tpls)[tab]);
		}

	}, [tab, tpls]);

	// Called when a single template is updated
	function templateUpdated(tpl) {

		// Make sure we have the latest templates
		tplsSet(tpls => {

			// Find the record in the proper type
			let iIndex = afindi(tpls[type], 'id', tpl.id);

			// If we find it
			if(iIndex > -1) {

				// Clone the templates
				let oTpls = clone(tpls);

				// Update the record
				oTpls[type][iIndex].content = tpl.content;

				// Return the new templates
				return oTpls;
			}

			// Return the existing templates
			return tpls;
		});
	}

	// Render, loading
	if(tpls === null) {
		return <Box className="page"><Typography>Loading...</Typography></Box>
	}

	// Render, no permission
	if(tpls === -1) {
		return <Box className="page"><Typography>No permissions to view SMS Workflow templates</Typography></Box>
	}

	console.log(type);

	// Render
	return (
		<Box id="sms_templates" className="flexRows flexGrow">
			<AppBar position="static" color="default" className="flexStatic">
				<Tabs
					onChange={(ev,tab) => tabSet(tab)}
					value={tab}
					variant="fullWidth"
				>
					{omap(tpls, (o,k) =>
						<Tab key={k} label={_TAB_NAMES[k]} />
					)}
				</Tabs>
			</AppBar>
			<Box className="page flexGrow">
				<Table stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell>Title</TableCell>
							<TableCell>Content</TableCell>
							<TableCell>&nbsp;</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{type !== null && tpls[type].map(o =>
							<Template key={o.id} value={o} onUpdate={templateUpdated} />
						)}
					</TableBody>
				</Table>
			</Box>
		</Box>
	);
}
