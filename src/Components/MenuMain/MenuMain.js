import React from 'react';
import axios from 'axios';
import socketIOClient from 'socket.io-client';
import { socketConnect } from 'socket.io-react';
import { Navbar, Nav, NavItem, Modal, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import RegisterLoginModal from '../RegisterLoginModal/RegisterLoginModal';
import CartModal from '../CartModal/CartModal';
import './MenuMain.css';

const socket = socketIOClient('http://localhost:8080');
// const socket = window.socket();

class MenuMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
      userId: '',
      cartId: '',
      cartContents: [],
      userName: '',
      userEmail: '',
      showLogin: false,
      showCart: false,
      togetherMenuText: 'Together',
      togetherStatus: 0,
      showTogetherModal: false,
      togetherlink: '',
      showTogetherReqModal: false,
      togetherReqfrom: '',
      togetherReqfromEmail: '',
      togethersessionid: '',
    };
  }

  componentDidMount() {
    if (window.localStorage.getItem('email') !== null) {
      this.setState({
        cartContents: JSON.parse(window.localStorage.getItem('cartContents')),
        isAuthenticated: true,
        showLogin: false,

      });
    }
    if (window.localStorage.getItem('togetherMenuText') !== null) {
      this.setState({
        togetherMenuText: window.localStorage.getItem('togetherMenuText'),
        togetherStatus: window.localStorage.getItem('togetherStatus'),
      });
    }
    socket.on('relayConnectTogether', (connectReq) => {
      // if (this.state.userEmail === 'ananddeb232@gmail.com') {
      //   const value = `email:${this.state.userEmail}togstatus${this.state.togetherStatus}requestEmail:${connectReq.requestEmail}`;
      //   alert(value);
      // }
      // alert('hello');
      const gettstatus = window.localStorage.getItem('togetherStatus');
      // alert('heuuuu');
      const userEmail = window.localStorage.getItem('email');
      const togetherStatus = window.localStorage.getItem('togetherStatus');
      // alert(userEmail);
      // alert(togetherStatus);
      if (connectReq.requestEmail === userEmail && this.state.togetherStatus == 0) {
        window.localStorage.setItem('togetherlink', connectReq.togetherlink);
        this.setState({
          showTogetherReqModal: true,
          togetherReqfrom: connectReq.senderName,
          togetherReqfromEmail: connectReq.senderEmail,
          togetherlink: connectReq.togetherlink,
        });
      } else if (connectReq.requestEmail === userEmail && this.state.togetherStatus == 1) {
        setTimeout(() => {
          // /
        }, 1000);
        const obj = {
          togetherresponse: 'rejected',
          rejectmessage: 'User is busy in another session',
          respondto: connectReq.senderEmail,
        };
        socket.emit('connectTogetherResponse', obj);
      }
    });
    socket.on('relayConnectTogetherResponse', (connectRes) => {
      // alert('heuuuu');
      const userEmail = window.localStorage.getItem('email');
      const togetherStatus = window.localStorage.getItem('togetherStatus');
      if (connectRes.respondto === userEmail && connectRes.togetherresponse === 'rejected') {
        alert(connectRes.rejectmessage);
        window.localStorage.removeItem('togetherMenuText');
        window.localStorage.setItem('togetherMenuText', 'Together');
        window.localStorage.removeItem('togetherStatus');
        window.localStorage.setItem('togetherStatus', 0);
        setTimeout(() => {
          window.TogetherJS();
        }, 1000);
        this.setState({

          togetherReqfrom: '',
          togetherReqfromEmail: '',
          togetherMenuText: 'Together',
          togetherStatus: 0,
          togetherlink: '',
        });
      } else if (connectRes.respondto === userEmail && connectRes.togetherresponse === 'accepted') {
        window.localStorage.removeItem('cartID');
        window.localStorage.setItem('cartID', connectRes.togethercartid);
        window.localStorage.removeItem('togethersessionid');
        window.localStorage.setItem('togethersessionid', connectRes.togethersessionid);

        this.setState({
          cartId: connectRes.togethercartid,
          togethersessionid: connectRes.togethersessionid,


        });
      }
    });
  }


  onLogin = (userObject) => {
    const cartId = window.localStorage.getItem('cartID');
    const cartContents = [];
    axios.get(`/api/v1/cart/fetchCart/${cartId}`).then((cartContentsResponse) => {
      if (!(cartContentsResponse.data.message.length === 0)) {
        cartContentsResponse.data.message.forEach((product) => {
          axios.get(`/api/v1/products/${product.productID}`).then((productDetailsResponse) => {
            const productDetails = productDetailsResponse.data.data;
            window.localStorage.setItem(productDetails.productID.toString(), 'ion-checkmark-round');
            cartContents.push(productDetails);
            window.localStorage.setItem('cartContents', JSON.stringify(cartContents));
            this.setState({
              cartContents,
              isAuthenticated: true,
              showLogin: false,
              userId: userObject.userID,
              cartId: userObject.cartID,
              userEmail: userObject.email,
              userName: userObject.name,

            });
          });
        });
      } else {
        window.localStorage.setItem('cartContents', JSON.stringify(cartContents));
        this.setState({
          cartContents,
          isAuthenticated: true,
          showLogin: false,
          userId: userObject.userID,
          cartId: userObject.cartID,
          userEmail: userObject.email,
          userName: userObject.name,
        });
      }
    });
  }

  onLogout = () => {
    const togethermyStatus = window.localStorage.getItem('togetherStatus');
    if (this.state.togetherStatus === 1 || togethermyStatus == 1) {
      this.toggleTogether();
    }
    axios.get('/user/logout').then((logoutResponse) => {
      if (logoutResponse.data.statusCode === 200) {
        window.localStorage.clear();
        this.setState({
          isAuthenticated: false,
          cartContents: [],
          showLogin: false,


          showCart: false,

        });
      }
    });
  }

  handleLoginModalClose = () => {
    this.setState({
      showLogin: false,
    });
  }
  handleLoginModalOpen = () => {
    this.setState({
      showLogin: true,
    });
  }
  handleTogetherModalClose = () => {
    this.setState({ showTogetherModal: false });
  }
  handleTogetherReqModalClose = () => {
    this.setState({ showTogetherReqModal: false });
  }
  handlTogetherReqModaleShow = () => {
    this.setState({ showTogetherReqModal: true });
  }
  handlTogetherModaleShow = () => {
    this.setState({ showTogetherModal: true });
  }
  handleTogetherInputEmail = (evt) => {
    this.setState({ requestemail: evt.target.value });
  }
  handleForwardTogetherRequest= () => {
    // const socket = socketIOClient(this.state.endpoint)

    // this emits an event to the socket (your server) with an argument of 'red'
    // you can make the argument any color you would like, or any kind of data you want to send.
    // alert(this.state.requestemail);
    // const socket = socketIOClient('http://127.0.0.1:8080');
    // const socket = socketIOClient('http://127.0.0.1:8080');
    const userEmail = window.localStorage.getItem('email');
    const userName = window.localStorage.getItem('name');
    const obj = {
      senderEmail: userEmail,
      senderName: userName,
      requestEmail: this.state.requestemail,
      togetherlink: this.state.togetherlink,
    };

    socket.emit('connectTogether', obj);
    // socket.emit('change color', 'red', 'yellow') | you can have multiple arguments


    alert('Request sent');

    // socket.emit('change color', 'red', 'yellow') | you can have multiple arguments
  }
  handleAcceptTogetherRequest = () => {
    const uName = window.localStorage.getItem('name');
    const email = window.localStorage.getItem('email');
    const sessionstr = this.state.togetherReqfromEmail + email;
    window.TogetherJSConfig_getUserName = function () {
      // alert(this.state.userName);
      return uName;
    };
    window.TogetherJS.refreshUserData();
    const url = `/api/v1/cart/initTogetherCart/${sessionstr}`;
    axios.get(url).then((togetherCart) => {
      // console.log(togetherCart.data);
      const newcartid = togetherCart.data.message;
      if (togetherCart.data.statusCode === 201) {
        const obj = {
          togetherresponse: 'accepted',
          togethercartid: newcartid,
          togethersessionid: sessionstr,

          respondto: this.state.togetherReqfromEmail,
        };
        window.TogetherJSConfig_getUserName = function () {
          // alert(this.state.userName);
          return uName;
        };
        window.TogetherJS.refreshUserData();
        setTimeout(() => {
          window.TogetherJSConfig_getUserName = function () {
            // alert(this.state.userName);
            return uName;
          };
          window.TogetherJS.refreshUserData();
        }, 1000);

        socket.emit('connectTogetherResponse', obj);
        window.localStorage.removeItem('cartID');
        window.localStorage.setItem('cartID', newcartid);
        window.localStorage.removeItem('togetherMenuText');
        window.localStorage.setItem('togetherMenuText', 'End Together');
        window.localStorage.removeItem('togetherStatus');
        window.localStorage.setItem('togetherStatus', 1);
        window.localStorage.removeItem(' togethersessionid');
        window.localStorage.setItem(' togethersessionid', sessionstr);
        this.setState({
          cartId: newcartid,
          togetherMenuText: 'End Together',
          togetherStatus: 1,
          togethersessionid: sessionstr,


        });
        alert(window.localStorage.getItem('togetherlink'));
        // window.location.href = window.localStorage.getItem('togetherlink');
        // window.TogetherJSConfig_getUserName = function () {
        //   // alert(this.state.userName);
        //   return uName;
        // };
        // window.TogetherJS.refreshUserData();
        // window.TogetherJS();
        window.location.assign(window.localStorage.getItem('togetherlink'));
      }
    });
  }
  handleRejectTogetherRequest = () => {
    const obj = {
      togetherresponse: 'rejected',
      rejectmessage: 'User did not approve request',
      respondto: this.state.togetherReqfromEmail,
    };
    socket.emit('connectTogetherResponse', obj);
    this.setState({
      showTogetherReqModal: false,

    });
  }
  onMessage = (message) => {
    console.log(message);
  }
  toggleTogether = () => {
    const uName = this.state.userName;
    // alert(uName);
    window.TogetherJSConfig_getUserName = function () {
      // alert(this.state.userName);
      return uName;
    };
    window.TogetherJS.refreshUserData();


    // alert(this.state.togetherStatus);
    if (this.state.togetherStatus != 1) {
      // alert('fgfg');

      const getturl = setInterval(() => {
        const turl = window.TogetherJS.shareUrl();
        if (turl !== null) {
          window.localStorage.setItem('togetherStatus', 1);
          window.localStorage.setItem('togetherMenuText', 'End Together');

          this.setState({
            togetherStatus: 1,
            togetherMenuText: 'End Together',
            showTogetherModal: true,
            togetherlink: window.TogetherJS.shareUrl(),
          });

          // alert(window.TogetherJS.shareUrl());
          // window.TogetherJS.refreshUserData();
          clearInterval(getturl);
        }
      }, 1000);
    } else {
      // window.localStorage.removeItem(' cartID');
      // window.localStorage.removeItem(' togetherMenuText');
      // window.localStorage.removeItem(' togetherStatus');
      // window.localStorage.removeItem(' togethersessionid');
      // // window.localStorage.setItem('cartID', origCart.data.message.cartID);

      // window.localStorage.setItem(' togethersessionid', '');
      // window.localStorage.setItem('togetherStatus', 0);
      // window.localStorage.setItem('togetherMenuText', 'Together');
      // this.setState({
      //   togetherStatus: 0,
      //   togetherMenuText: 'Together',
      //   togetherlink: '',
      //   togetherReqfrom: '',
      //   togetherReqfromEmail: '',
      //   togethersessionid: '',
      // });
      const userId = window.localStorage.getItem('userID');
      const url = `/api/v1/cart/initCart/${userId}`;

      axios.get(url).then((origCart) => {
        if (origCart.data.statusCode === 200) {
          alert(window.localStorage.getItem('cartID'));
          alert(origCart.data.message.cartID);
          // alert(origCart.data.message);
          console.log(origCart.data.message);
          window.localStorage.removeItem(' cartID');
          window.localStorage.removeItem(' togetherMenuText');
          window.localStorage.removeItem(' togetherStatus');
          window.localStorage.removeItem(' togethersessionid');
          window.localStorage.setItem('cartID', origCart.data.message.cartID);

          window.localStorage.setItem(' togethersessionid', '');
          window.localStorage.setItem('togetherStatus', 0);
          window.localStorage.setItem('togetherMenuText', 'Together');

          this.setState({
            togetherStatus: 0,
            togetherMenuText: 'Together',
            togetherlink: '',
            togetherReqfrom: '',
            togetherReqfromEmail: '',
            togethersessionid: '',
          });
        }
      });
    }
    window.TogetherJS();
  }

  handleCartModalClose = () => {
    this.setState({
      showCart: false,
    });
  }
  handleCartModalOpen = () => {
    this.setState({
      showCart: true,
      cartContents: JSON.parse(window.localStorage.getItem('cartContents')),
    });
  }
  deleteCartContents = (productId, cartId) => {
    const currentCartContents = this.state.cartContents;
    for (let i = 0; i < currentCartContents.length; i += 1) {
      if (currentCartContents[i].productID === productId) {
        axios({
          method: 'delete',
          url: '/api/v1/cart/removeFromCart',
          data: {
            cartId,
            productId,
          },
        }).then((removeFromCartResponse) => {
          if (removeFromCartResponse.data.statusCode === 200) {
            currentCartContents.splice(i, 1);
            window.localStorage.removeItem(productId);
            window.localStorage.setItem('cartContents', JSON.stringify(currentCartContents));
            this.setState({
              cartContents: currentCartContents,
            });
          }
        });
      }
    }
  }
  render() {
    if (!this.state.isAuthenticated) {
      return (
        <Navbar className="NavbarMain">

          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/" ><div className="NavbarIcon" /></Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav pullRight classname="NavbarMain">
              <NavItem eventKey={1} >
                <div
                  className="NavbarText"
                  onClick={() => { this.handleLoginModalOpen(); }}
                >Login / Register
                </div>
              </NavItem>
            </Nav>
          </Navbar.Collapse>
          <RegisterLoginModal
            onLogin={this.onLogin}
            showLogin={this.state.showLogin}
            handleClose={this.handleLoginModalClose}
          />
        </Navbar>
      );
    }
    return (
      <Navbar className="NavbarMain">
        <Navbar.Header>
          <Navbar.Brand>
            <Link to="/" ><div className="NavbarIcon" /></Link>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav pullRight classname="NavbarMain">
            <NavItem eventKey={1} href="#">
              <div className="NavbarText">Hi {window.localStorage.getItem('name')}</div>
            </NavItem>
            <NavItem eventKey={1} href="#">
              <div className="NavbarText" onClick={() => { this.toggleTogether(); }}>{this.state.togetherMenuText}</div>
            </NavItem>

            <NavItem eventKey={1} href="#">
              <div className="NavbarText" onClick={() => { this.handleCartModalOpen(); }}><FontAwesomeIcon icon="shopping-cart" /> {this.state.togetherStatus === 1 ? 'Our' : 'My'} Cart</div>
            </NavItem>
            <NavItem eventKey={1} href="#">
              <div className="NavbarText" onClick={() => { this.onLogout(); }}><FontAwesomeIcon icon="sign-out-alt" /> Logout</div>
            </NavItem>
          </Nav>
        </Navbar.Collapse>
        <Modal show={this.state.showTogetherModal} onHide={this.handleTogetherModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>Lets Shop Together</Modal.Title>
          </Modal.Header>
          <Modal.Body >
            <input type="text" placeholder="Enter email of friend to shop with" onChange={this.handleTogetherInputEmail} />
            <button onClick={this.handleForwardTogetherRequest}>Send request </button>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleTogetherModalClose}>Close</Button>
          </Modal.Footer>
        </Modal>
        <Modal show={this.state.showTogetherReqModal} onHide={this.handleTogetherReqModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>Your Friend {this.state.togetherReqfrom}  Sent a Request to Shop Together</Modal.Title>
          </Modal.Header>
          <Modal.Body >
            <button onClick={this.handleAcceptTogetherRequest}>Accept Request </button>
            <button onClick={this.handleRejectTogetherRequest}>Reject Request </button>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleTogetherReqModalClose}>Close</Button>
          </Modal.Footer>
        </Modal>
        <CartModal
          cartContents={this.state.cartContents}
          handleCartModalClose={this.handleCartModalClose}
          deleteCartContents={(productId, cartId) => { this.deleteCartContents(productId, cartId); }}
          cartId={window.localStorage.getItem('cartID')}
          showCart={this.state.showCart}
        />
      </Navbar>
    );
  }
}


export default socketConnect(MenuMain);

