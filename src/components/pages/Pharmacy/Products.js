/**
 * Pharmacy Products
 *
 * Page to manage products and their NDCs by pharmacy
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-01-05
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

// Format Components
import { Form, Results } from 'shared/components/Format';
import { SelectData } from 'shared/components/Format/Shared';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

// Agent Definition
import ProductDef from 'definitions/prescriptions/product';
ProductDef['pharmacy']['__react__']['options'] = new SelectData('prescriptions', 'pharmacies', 'pharmacyId', 'name');

// Generate the agent Tree
const ProductTree = new Tree(ProductDef);

// Default set of rights when no user
const _NO_RIGHTS = {
	create: false,
	delete: false,
	update: false,
	pharmacy: false
}

/**
 * Products
 *
 * Lists all products available to the signed in user
 *
 * @name Products
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Products(props) {

	// State
	let [create, createSet] = useState(false);
	let [products, productsSet] = useState(null);
	let [rights, rightsSet] = useState(_NO_RIGHTS);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			productsFetch();
			rightsSet({
				create: Rights.has('rx_product', 'create'),
				delete: Rights.has('rx_product', 'delete'),
				update: Rights.has('rx_product', 'update'),
				pharmacy: Utils.getIdents(props.user, 'rx_product')
			})
		} else {
			productsSet(null);
			rightsSet(_NO_RIGHTS);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Add the created product to the list
	function productCreated(product) {

		// Hide the create form
		createSet(false);

		// Use the current products to set the new products
		productsSet(products => {

			// Clone the products
			let ret = clone(products);

			// Add the product to the front of the list
			ret.unshift(product);

			// Return the new products
			return ret;
		})
	}

	// Remove a product
	function productRemove(_id) {

		// Use the current products to set the new products
		productsSet(products => {

			// Clone the products
			let ret = clone(products);

			// Find the index
			let iIndex = afindi(ret, '_id', _id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new products
			return ret;
		});
	}

	// Fetch all the products from the server
	function productsFetch() {

		// Fetch all products
		Rest.read('prescriptions', 'products', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the products
				productsSet(res.data);
			}
		});
	}

	// Update a product
	function productUpdate(product) {

		// Use the current products to set the new products
		productsSet(products => {

			// Clone the products
			let ret = clone(products);

			// Find the index
			let iIndex = afindi(ret, '_id', product._id);

			// If one is found, update it
			if(iIndex > -1) {
				ret[iIndex] = product;
			}

			// Return the new products
			return ret;
		});
	}

	// Return the rendered component
	return (
		<Box id="pharmacyProducts" className="page">
			<Box className="page_header">
				<Typography className="title">Products to NDCs</Typography>
				{rights.create &&
					<Tooltip title="Create new Product">
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
						noun="product"
						service="prescriptions"
						success={productCreated}
						tree={ProductTree}
						type="create"
						value={{
							pharmacy: rights.pharmacy ? rights.pharmacy[0] : ''
						}}
					/>
				</Paper>
			}
			{products === null ?
				<Box>Loading...</Box>
			:
				<Results
					data={products}
					noun="product"
					orderBy="key"
					remove={rights.delete ? productRemove : false}
					service="prescriptions"
					tree={ProductTree}
					update={rights.update ? productUpdate : false}
				/>
			}
		</Box>
	);
}

// Valid props
Products.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
