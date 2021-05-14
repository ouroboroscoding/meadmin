/**
 * Claims by Provider
 *
 * Page to manage claims by providers in the CS tool
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
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Provider Definition
import ClaimDef from 'definitions/monolith/kt_order_claim';

// Generate the provider Tree
const ClaimTree = new Tree(clone(ClaimDef));

/**
 * Claims Provider
 *
 * Lists all claims made by providers
 *
 * @name ClaimsProvider
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function ClaimsProvider(props) {

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

		// Fetch all providers
		Rest.read('monolith', 'provider/claims', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the providers
				claimsSet(res.data);
			}
		});
	}

	// Remove a claim
	function removeClaim(customerId) {

		// Use the current providers to set the new providers
		claimsSet(claims => {

			// Clone the claims
			let ret = clone(claims);

			// Find the index
			let iIndex = afindi(ret, 'customerId', customerId);

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
		<Box id="claimsProvider" className="page flexGrow">
			<Box className="page_header">
				<Typography className="title">Claims by Providers</Typography>
			</Box>
			{claims === null ?
				<Box>Loading...</Box>
			:
				<Results
					data={claims}
					noun="provider/claim"
					orderBy="createdAt"
					remove={Rights.has('prov_overwrite', 'delete') ? removeClaim : false}
					service="monolith"
					tree={ClaimTree}
					update={false}
				/>
			}
		</Box>
	);
}

// Valid props
ClaimsProvider.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
