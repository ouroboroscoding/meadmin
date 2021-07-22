/**
 * Campaigns
 *
 * Page to manage konnektive campaigns
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-07-22
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';
import ListIcon from '@material-ui/icons/List';

// Local components
import CampaignProducts from './CampaignProducts';

// Format Components
import { Form, Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Campaign Definition
import CampaignDef from 'definitions/konnektive/campaign';

// Generate the Campaign Tree
const CampaignTree = new Tree(CampaignDef);

// Default set of rights when no user
const _NO_RIGHTS = {
	create: false,
	products: false,
	update: false
}

/**
 * Campaigns
 *
 * Lists all campaigns available
 *
 * @name Campaigns
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Campaigns(props) {

	// State
	let [create, createSet] = useState(false);
	let [campaigns, campaignsSet] = useState(null);
	let [rights, rightsSet] = useState(_NO_RIGHTS);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			campaignsFetch();
			rightsSet({
				create: Rights.has('campaigns', 'create'),
				products: Rights.has('products', 'read'),
				update: Rights.has('campaigns', 'update')
			})
		} else {
			campaignsSet(null);
			rightsSet(_NO_RIGHTS);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Add the created campaign to the list
	function campaignCreated(campaign) {

		// Hide the create form
		createSet(false);

		// Use the current campaigns to set the new campaigns
		campaignsSet(campaigns => {

			// Clone the campaigns
			let ret = clone(campaigns);

			// Add the campaign to the front of the list
			ret.unshift(campaign);

			// Return the new campaigns
			return ret;
		})
	}

	// Fetch all the campaigns from the server
	function campaignsFetch() {

		// Fetch all campaigns
		Rest.read('konnektive', 'campaigns', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the campaigns
				campaignsSet(res.data);
			}
		});
	}

	// Update a campaign
	function campaignUpdate(campaign) {

		// Use the current campaigns to set the new campaigns
		campaignsSet(campaigns => {

			// Clone the campaigns
			let ret = clone(campaigns);

			// Find the index
			let iIndex = afindi(ret, '_id', campaign._id);

			// If one is found, update it
			if(iIndex > -1) {
				ret[iIndex] = campaign;
			}

			// Return the new campaigns
			return ret;
		});
	}

	// Return the rendered component
	return (
		<Box id="konnektiveCampaigns" className="page flexGrow">
			<Box className="page_header">
				<Typography className="title">Konnektive Campaigns</Typography>
				{rights.create &&
					<Tooltip title="Create new Campaign">
						<IconButton onClick={ev => createSet(b => !b)}>
							<AddCircleIcon className="icon" />
						</IconButton>
					</Tooltip>
				}
			</Box>
			{create &&
				<Paper className="padded">
					<Form
						cancel={ev => createSet(false)}
						noun="campaign"
						service="konnektive"
						success={campaignCreated}
						tree={CampaignTree}
						type="create"
					/>
				</Paper>
			}
			{campaigns === null ?
				<Box>Loading...</Box>
			:
				<Results
					actions={rights.products ? [
						{tooltip: "Campaign Products", icon: ListIcon, component: CampaignProducts}
					] : []}
					data={campaigns}
					noun="campaign"
					orderBy="name"
					remove={false}
					service="konnektive"
					tree={CampaignTree}
					update={rights.update ? campaignUpdate : false}
				/>
			}
		</Box>
	);
}

// Valid props
Campaigns.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
