import React, { Component } from "react";
import { Row, Table} from 'reactstrap';
import { backUrl } from "../../../constants/defaultValues"
import IntlMessages from "../../../helpers/IntlMessages";
import { NotificationManager } from "../../../components/common/react-notifications";
import axios from 'axios';
import Label from "reactstrap/lib/Label";
import Editmanager from "../../../containers/applications/Editmanager"


export default class ManagerPage extends Component {

  constructor() {
    super();
    this.state = {
      headers:["ID","Date","Profit","Client Username","Balance"],
      employees: [],
      users:[],
      m_name:"",
      m_username:"",
      m_email:"",
      m_password:"",
      m_macomis:"",
      m_ucomis:30,
      m_wallet:"",
      adminWallet:"",
      modal_show:false
    };
    this.getEmps = this.getEmps.bind(this);
    this.eachUsers = this.eachUsers.bind(this);
  }

  componentDidMount() {
    this.getEmps();
    this.eachUsers();
  }

  getEmps() {
    axios
      .get(backUrl + '/api/backend_user')
        .then((res)=>{
          this.setState({employees:res.data});
        })
        .catch(err => { 
          console.error(err);
        });
  }

  eachUsers(){
    axios
      .get(backUrl + '/api/pay_detail')
      .then((res)=>{
        this.setState({users:res.data});
      })
      .catch(err => {
        console.error(err);
      });
  }

  addmanager(){
  	if (this.state.m_wallet === ""){
  		NotificationManager.success("Please add wallet address to add new manager.",this.state.name.toUpperCase() + " : New Mananger" ,5000,null,"null",'');
  	}
    else if (this.state.m_ucomis < 5) { NotificationManager.warning("Please set user commission higher than 5.","New Mananger",3000,null,"null",'');}
    else if (this.state.m_ucomis > 100) { NotificationManager.warning("Please set user commission lower than 100.","New Mananger",3000,null,"null",'');}
  	else {
  		var data = {name:this.state.m_name,username:this.state.m_username,email:this.state.m_email,password:this.state.m_password,m_comis:this.state.m_macomis,u_comis:this.state.m_ucomis.toString(),wallet:this.state.m_wallet};
	    axios
	      .post(backUrl + '/api/backend_add_user', data)
	      .then(async(result) => {
	        if (result.data.message === "email exist") {
	          NotificationManager.success("Email exist, Please input other correct email.",this.state.name.toUpperCase() + " : New Mananger" ,5000,null,"null",'');
	        }
	        else if (result.data.message === "name exist") {
	          NotificationManager.success("Name or Username exist, Please input name as correctly.",this.state.name.toUpperCase() + " : New Mananger" ,5000,null,"null",'');
	        }
	        else {
	          NotificationManager.success("Registered as successfully.",this.state.name.toUpperCase() + " : New Mananger" ,5000,null,"null",'');
	        }
	        await this.sleep(2000);
	      })
	      .catch(err => {
	        console.error(err);
	      });
	    this.getEmps();
	    this.eachUsers();
  	}
  }

  renderTableHeader(email) {
    let headers = [];
    this.state.headers.forEach(header => {
      headers.push(<th key={email+header}>{header.toUpperCase()}</th>);
    });
    return (<tr className="h6 w-100">{headers}</tr>);
  }

  renderTableData(name) {
    return this.state.users.map((manager, index) => {
      const { user, client, balance, amount, updated_at} = manager; //destructuring   update_at, profit, profit_at,
      const new_amount_at = updated_at.toString().split("T")[0];
      if (user === name){
        return (
          <tr className="h5" key={name+index}>
            <td className="w-10">{index+1}</td>
            <td className="w-30">{new_amount_at}</td>
            <td className="w-20">{amount}</td>
            <td className="w-20">{client}</td>
            <td className="w-20">{Math.round(balance*1000)/1000}</td>
          </tr>    
        );
      }
      else {
        return null;
      }
    })
  }
  
  editmanager(employe){
    this.setState({m_name:employe.name});
    this.setState({m_username:employe.username});
    this.setState({m_email:employe.email});
    this.setState({m_password:employe.pass});
    this.setState({m_macomis:employe.m_comis});
    this.setState({m_ucomis:parseInt(employe.u_comis)});
    this.setState({m_wallet:employe.wallet});
    this.toggleModal();
  }

  delmanager(employe){
    if ( window.confirm("Are you sure you wish to delete this manager? \nClients will be deleted, too.\nSo you need to pause his clients at first.") ){
      axios
      .post(backUrl + '/api/backend_remove_user', employe)
      .then((result) => {
        if ( result.data.message === "success") {
          NotificationManager.success("Delete manager and contained clients as successfully.","Delete Mananger" ,3000,null,"null",'');
          this.getEmps = this.getEmps.bind(this);
          this.eachUsers = this.eachUsers.bind(this);
          window.location.reload();
        }
        else {
          NotificationManager.error(" Have problems.","Delete Mananger" ,3000,null,"null",'');
        }
      })
      .catch(err => {
        console.error(err);
      });
    }
  }

  toggleModal = () => {
    this.setState({
      modal_show: !this.state.modal_show
    });
  };
  
  renderModal() {
    if(this.state.modal_show){
      // console.log(this.state.m_wallet);
      return (<Editmanager toggleModal={this.toggleModal} modal_show={this.state.modal_show} m_name={this.state.m_name} m_username={this.state.m_username} m_email={this.state.m_email} m_password={this.state.m_password} m_macomis={this.state.m_macomis} m_ucomis={this.state.m_ucomis} m_wallet={this.state.m_wallet}/>)
    }
  }

  renderdelbtn(employe){
    if (employe.username !== "RooT858#"){
      return (
        <button className="mr-2" style={{fontSize:"13px",width:"130px",borderWidth:"0px",color:"black"}} onClick={() => this.delmanager(employe)}>Delete Mananger</button>
      );
    }
  }

  rendertotal(employe){
    let total = 0;
    if (employe.username !== "RooT858#"){
      for( let i=0;i<this.state.users.length;i++){
        if ( employe.username === this.state.users[i].user )
        total = total + parseFloat(this.state.users[i].balance);
      }
      return (
        <Label className="mt-2" style={{fontSize:"16px"}}>Total BTC : {Math.round(total*1000)/1000}BTC</Label>
      );
    }
  }

  render() {
    if (localStorage.getItem('user_type') === "0") {
      return (
        <Row className = "w-100 mr-0 ml-0" >
          {this.renderModal()}
          <div className="w-90" style={{marginBottom:"2%", marginLeft:"2%",marginRight:"2%",alignContent:"center"}}>        
            <label className="col-md-1 param_model_text"><IntlMessages id="manager.name" /></label>
            <input className="col-md-2" type="text" style={{marginRight:"3%"}} onChange={event => {this.setState({ m_name: event.target.value });}} required/>
            <label className="col-md-2 param_model_text"><IntlMessages id="manager.mancomis" /></label>
            <input className="col-md-2" type="text" min={5} max={100} style={{marginRight:"3%"}} onChange={event => {this.setState({ m_macomis: event.target.value });}} required/>
            <label className="col-md-1 param_model_text"><IntlMessages id="manager.uname" /></label>
            <input className="col-md-2" type="text" style={{marginRight:"3%"}} onChange={event => {this.setState({ m_username: event.target.value });}} required/>
            <label className="col-md-1 param_model_text"><IntlMessages id="manager.email" /></label>
            <input className="col-md-2" type="text" style={{marginRight:"3%"}} onChange={event => {this.setState({ m_email: event.target.value });}} required/>
            <label className="col-md-2 param_model_text">System Commission</label>
            <input className="col-md-2" type="number" min={5} max={100} style={{marginRight:"3%"}} onChange={event => {this.setState({ m_ucomis: event.target.value });}} required/>
            <label className="col-md-1 param_model_text"><IntlMessages id="manager.pass" /></label>
            <input className="col-md-2" type="text" style={{marginRight:"3%"}} onChange={event => {this.setState({ m_password: event.target.value });}} required/>
            <label className="col-md-1 param_model_text"><IntlMessages id="manager.wallet" /></label>
            <input className="col-md-2" type="text" style={{marginRight:"3%"}} onChange={event => {this.setState({ m_wallet: event.target.value });}} required/>
            <button className="col-md-4 center mt-1" style={{margin:"auto",marginLeft:"28%"}} color="primary" onClick={() => this.addmanager()}>Add Mananger</button>
          </div>
          {this.state.employees.map((employe,index) => {
            const { username, email } =  employe;
            return (
              <Row className="w-90 m-auto" key={email}>
                  <Row className="manager_title">
                    <Label className="mr-2 mt-2">Manager(Affiliate) Username : {username} ,</Label>
                    <Label className="mr-2 mt-2" > Manager Email : {email} </Label>
                    <button className="mr-2" style={{fontSize:"13px",width:"120px",borderWidth:"0px",color:"blue"}} onClick={() => this.editmanager(employe)}>Edit Mananger</button>
                    {this.renderdelbtn(employe)}
                    {this.rendertotal(employe)}
                  </Row>
                  <Table id='report' className="managers h5">
                    <tbody>
                      {this.renderTableHeader(email)}
                      {this.renderTableData(username)}
                    </tbody>
                  </Table>
              </Row>
            );
          })}
        </Row>
      );
    }
    else {
      return (
        <Row className="w-90 m-auto" key={localStorage.getItem('user_id')}>
          <Row className="manager_title">
            <Label className="mr-4">Manager Name : {localStorage.getItem('user_name')} ,</Label>
            {/* <Label className="mr-4"> Manager Eamil : {email} </Label> */}
          </Row>
          <Table id='report' className="managers h5">
            <tbody>
              {this.renderTableHeader(localStorage.getItem('user_name'))}
              {this.renderTableData(localStorage.getItem('user_name'))}
            </tbody>
          </Table>
        </Row>
      )
    }    
  }
}
