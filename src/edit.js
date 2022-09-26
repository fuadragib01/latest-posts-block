import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, QueryControls } from '@wordpress/components';
import { RawHTML } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { format, dateI18n, __experimentalGetSettings } from '@wordpress/date';
import './editor.scss';

export default function Edit( { attributes, setAttributes } ) {
	const { numberOfPosts, displayFeaturedImage, order, orderBy, categories } =
		attributes;
	const catIds =
		categories && categories.length > 0
			? categories.map( ( cat ) => cat.id )
			: [];
	const posts = useSelect(
		( select ) => {
			return select( 'core' ).getEntityRecords( 'postType', 'post', {
				per_page: numberOfPosts,
				_embed: true,
				order,
				orderby: orderBy,
				categories: catIds,
			} );
		},
		[ numberOfPosts, order, orderBy, categories ]
	);

	const allCats = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords( 'taxonomy', 'category', {
			per_page: -1,
		} );
	}, [] );

	const catSuggestions = {};
	if ( allCats ) {
		for ( let i = 0; i < allCats.length; i++ ) {
			const cat = allCats[ i ];
			catSuggestions[ cat.name ] = cat;
		}
	}

	const onDisplayFeaturedImageChange = ( value ) => {
		setAttributes( { displayFeaturedImage: value } );
	};
	const onNumberOfItemsChange = ( val ) => {
		setAttributes( { numberOfPosts: val } );
	};
	const onCategoryChange = ( values ) => {
		const hasNoSuggestion = values.some(
			( value ) => typeof value === 'string' && ! catSuggestions[ value ]
		);
		if ( hasNoSuggestion ) return;

		const updatedCats = values.map( ( token ) => {
			return typeof token === 'string' ? catSuggestions[ token ] : token;
		} );
		setAttributes( { categories: updatedCats } );
	};
	// console.log( posts );
	return (
		<>
			<InspectorControls>
				<PanelBody>
					<ToggleControl
						label={ __( 'Display featured image', 'latest-posts' ) }
						checked={ displayFeaturedImage }
						onChange={ onDisplayFeaturedImageChange }
					/>
					<QueryControls
						numberOfItems={ numberOfPosts }
						onNumberOfItemsChange={ onNumberOfItemsChange }
						maxItems={ 10 }
						minItems={ 1 }
						orderBy={ orderBy }
						onOrderByChange={ ( val ) =>
							setAttributes( { orderBy: val } )
						}
						order={ order }
						onOrderChange={ ( val ) =>
							setAttributes( { order: val } )
						}
						categorySuggestions={ catSuggestions }
						selectedCategories={ categories }
						onCategoryChange={ onCategoryChange }
					/>
				</PanelBody>
			</InspectorControls>
			<ul { ...useBlockProps() }>
				{ posts &&
					posts.map( ( post ) => {
						const featuredImage =
							post._embedded &&
							post._embedded[ 'wp:featuredmedia' ] &&
							post._embedded[ 'wp:featuredmedia' ].length > 0 &&
							post._embedded[ 'wp:featuredmedia' ][ 0 ];
						return (
							<li key={ post.id }>
								{ displayFeaturedImage && featuredImage && (
									<img
										src={
											featuredImage.media_details.sizes
												.medium.source_url
										}
										alt={ featuredImage.alt_text }
									/>
								) }
								<h5>
									<a href={ post.link }>
										{ post.title.rendered ? (
											<RawHTML>
												{ post.title.rendered }
											</RawHTML>
										) : (
											__( '(No title)', 'latest-posts' )
										) }
									</a>
								</h5>
								{ post.date_gmt && (
									<time
										dateTime={ format(
											'c',
											post.date_gmt
										) }
									>
										{ dateI18n(
											__experimentalGetSettings().formats
												.date,
											post.date_gmt
										) }
									</time>
								) }
								{ post.excerpt.rendered && (
									<RawHTML>{ post.excerpt.rendered }</RawHTML>
								) }
							</li>
						);
					} ) }
			</ul>
		</>
	);
}
