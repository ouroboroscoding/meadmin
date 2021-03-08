/**
 * Links
 *
 * Page to manage urls in link shortening service
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-03-08
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';
import ListIcon from '@material-ui/icons/List';

// Format Components
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, afindo, clone } from 'shared/generic/tools';

// Definitions
import LinkDef from 'definitions/link/url';
import ViewDef from 'definitions/link/view';

// Trees
const LinkTree = new Tree(LinkDef);
const ViewTree = new Tree(ViewDef);

// Default set of rights when no user
const _NO_RIGHTS = {
	create: false,
	delete: false,
	read: false
}

/**
 * Create
 *
 * Form for creating a new link
 *
 * @name Create
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Create(props) {

	// URL
	let [url, urlSet] = useState('');
	let [error, errorSet] = useState(false);

	// Create the new link
	function create() {

		// Send the data to the service via rest
		Rest.create('link', 'url', {
			url: url
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1001) {
					errorSet(res.error.msg.url);
				} else {
					Events.trigger('error', JSON.stringify(res.error.msg));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Show the popup
				Events.trigger('success', 'Created');

				// Let the parent know
				props.success({
					_created: (Date.now()/1000),
					url: url,
					views: 0,
					...res.data
				});
			}
		});
	}

	// Called on any key press
	function keyPressed(ev) {
		if(ev.key === 'Enter') {
			return create();
		}
		errorSet(false);
	}

	// Render
	return (
		<Paper className="padded form">
			<Box>
				<TextField
					error={error !== false}
					helperText={error}
					onKeyPress={keyPressed}
					label="URL"
					onChange={ev => urlSet(ev.currentTarget.value)}
					placeholder="https://domain.com/some/very/very/long-url.html"
					type="text"
					value={url}
					variant="outlined"
					InputLabelProps={{
						shrink: true,
					}}
				/>
			</Box>
			<Box className="actions">
				{props.cancel &&
					<Button variant="contained" color="secondary" onClick={props.cancel}>Cancel</Button>
				}
				<Button variant="contained" color="primary" onClick={create}>Create</Button>
			</Box>
		</Paper>
	)
}

// Valid props
Create.propTypes = {
	cancel: PropTypes.func.isRequired,
	success: PropTypes.func.isRequired
}

/**
 * Links
 *
 * Handles displaying urls created
 *
 * @name Links
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Links(props) {

	// State
	let [create, createSet] = useState(false);
	let [links, linksSet] = useState(null);
	let [rights, rightsSet] = useState(_NO_RIGHTS);
	let [dialog, dialogSet] = useState(false);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			linksFetch();
			rightsSet({
				create: Rights.has('link', 'create'),
				delete: Rights.has('link', 'delete'),
				read: Rights.has('link', 'read')
			})
		} else {
			linksSet(null);
			rightsSet(_NO_RIGHTS);
			dialogSet(false);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Called after a link is created
	function linkCreated(link) {

		// Clone the current links
		let lErrors = clone(links);

		// Push the link to the start of the list
		lErrors.unshift(link);

		// Set the new state
		linksSet(lErrors);
		createSet(false);
	}

	// Called after a link is removed
	function linkRemoved(_id) {

		// Try to find the index using the ID
		let iIndex = afindi(links, '_id', _id);

		// If the index exists
		if(iIndex > -1) {

			// Clone the current links
			let lErrors = clone(links);

			// Remove the index from the list
			lErrors.splice(iIndex, 1);

			// Set the new state
			linksSet(lErrors);
		}
	}

	// Fetch all links
	function linksFetch() {

		// Make the request to the server
		Rest.read('link', 'urls', {}).done(res => {

			// If there's an link or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.link));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				linksSet(res.data);
			}
		});
	}

	// Show individual url views
	function viewsShow(_id) {

		// Find the record associated with the ID
		let oUrl = afindo(links, '_id', _id);

		// Init the new dialog value
		let oDialog = {
			name: oUrl.url,
			results: 0
		};

		// Display the dialog
		dialogSet(oDialog);

		// Make the request to the server for the results
		Rest.read('link', 'stats', {
			_id: _id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we have data
			if(res.data) {
				let oNewDialog = clone(oDialog);
				oNewDialog.results = res.data;
				dialogSet(oNewDialog);
			}
		});
	}

	// If we haven't finished loading
	if(links === null) {
		return <Box className="page"><Typography>Loading...</Typography></Box>
	}

	// Render
	return (
		<Box id="links" className="page">
			<Box className="page_header">
				<Typography className="title">Links</Typography>
				{rights.create &&
					<Tooltip title="Add Link">
						<IconButton onClick={ev => createSet(b => !b)}>
							<AddCircleIcon />
						</IconButton>
					</Tooltip>
				}
			</Box>
			{create &&
				<Create
					cancel={ev => createSet(b => !b)}
					success={linkCreated}
				/>
			}
			{links.length === 0 ?
				<Typography>No Links found.</Typography>
			:
				<Results
					actions={[
						{"tooltip": "Views", "icon": ListIcon, "callback": viewsShow}
					]}
					data={links}
					noun="url"
					orderBy="url"
					remove={rights.delete ? linkRemoved : false}
					service="link"
					tree={LinkTree}
					update={false}
				/>
			}
			{dialog &&
				<Dialog
					aria-labelledby="views-dialog-title"
					maxWidth="lg"
					onClose={ev => dialogSet(false)}
					open={true}
				>
					<DialogTitle id="views-dialog-title">{dialog.name}</DialogTitle>
					<DialogContent dividers>
						{dialog.results === 0 ?
							<Typography>Loading...</Typography>
						:
							<React.Fragment>
								<Results
									data={dialog.results}
									noun=""
									orderBy="date"
									remove={false}
									service=""
									tree={ViewTree}
									update={false}
								/>
							</React.Fragment>
						}
					</DialogContent>
				</Dialog>
			}
		</Box>
	);
}

// Valid props
Links.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
