/**
 * Claims by Agent
 *
 * Page to manage claims by agents in the CS tool
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-29
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

// Format Components
import ResultsComponent from 'shared/components/format/Results';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

// Agent Definition
import ClaimDef from 'definitions/monolith/customer_claimed';

// Generate the agent Tree
const ClaimTree = new Tree(ClaimDef);

/**
 * Claims Agent
 *
 * Lists all claims made by agents
 *
 * @name ClaimsAgent
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function ClaimsAgent(props) {

	// State
	let [claims, claimsSet] = useState(null);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			fetchClaims();
		} else {
			claimsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Fetch all the claims from the server
	function fetchClaims() {

		// Fetch all agents
		Rest.read('monolith', 'agent/claims', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the agents
				claimsSet(res.data);
			}
		});
	}

	// Remove a claim
	function removeClaim(phone) {

		// Use the current agents to set the new agents
		claimsSet(claims => {

			// Clone the claims
			let ret = clone(claims);

			// Find the index
			let iIndex = afindi(ret, 'phoneNumber', phone);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new claims
			return ret;
		});
	}

	// Return the rendered component
	return (
		<Box id="claimsAgent" class="page">
			<Box className="page_header">
				<Typography className="title">Claims by Agents</Typography>
			</Box>
			{claims === null ?
				<Box>Loading...</Box>
			:
				<ResultsComponent
					data={claims}
					noun="agent/claim"
					orderBy="createdAt"
					remove={Utils.hasRight(props.user, 'csr_overwrite', 'delete') ? removeClaim : false}
					service="monolith"
					tree={ClaimTree}
					update={false}
				/>
			}
		</Box>
	);
}

// Valid props
ClaimsAgent.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
