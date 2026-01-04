import React, { useEffect, useState } from 'react';
import './ListProduct.css';
import cross from '../../assets/cross.png';

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([]);

  const fetchInfo = async () => {
    try {
      const res = await fetch('http://localhost:4000/allproducts');
      const data = await res.json();
      setAllProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const removeProduct = async (id) => {
    try {
      const res = await fetch('http://localhost:4000/removeproduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (result.success) {
        setAllProducts(prev => prev.filter(p => p.id !== id));
        console.log("Removed product ID:", id);
      } else {
        console.error("Failed to remove product:", result.message);
      }
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  return (
    <div className='list-product'>
      <h1>All Products List</h1>

      <div className="listproduct-format-main header">
        <p>Product</p>
        <p>Title</p>
        <p>Old Price</p>
        <p>New Price</p>
        <p>Category</p>
        <p>Remove</p>
      </div>

      <div className="listproduct-allproducts">
        <hr />
        {allProducts.map((product, index) => (
          <React.Fragment key={product.id || index}>
            <div className="listproduct-format-main listproduct-format">
              <img
                src={product.image || '/fallback-product.png'}
                alt={product.name || 'product'}
                className="listproduct-product-icon"
              />
              <p>{product.name}</p>
              <p>${product.old_price}</p>
              <p>${product.new_price}</p>
              <p>{product.category}</p>
              <img
                onClick={() => removeProduct(product.id)}
                className='listproduct-remove-icon'
                src={cross}
                alt="remove"
              />
            </div>
            <hr />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ListProduct;
