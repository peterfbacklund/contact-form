vm = new ContactViewModel();
var primer = null;

$(document).ready(initApp);

function initApp() {
  getUserProperties();
  ko.applyBindings(vm);
}

function ContactViewModel() {
  let self = this;
  this.currentUserProfile = ko.observable();

  this.requestId = ko.observable();
  this.requestorName = ko.observable();
  this.requestorTitle = ko.observable();
  this.requestorOfficeSymbol = ko.observable("cgfs");
  this.requestorTelephone = ko.observable();
  this.requestorEmail = ko.observable("");
  this.requestorType = ko.observable();
  this.requestorTypeOpts = ko.observableArray([
    "Employee - Specific Inquiry",
    "Employee - General Inquiry",
    "Bureau HR Specialist",
    "Post Payroll Specialist",
  ]);

  this.requestorIsEmployeeSpecific = ko.pureComputed(function () {
    return self.requestorType() == "Employee - Specific Inquiry"
  })

  this.requestorIsEmployee = ko.pureComputed(function () {
    return self.requestorType() == "Employee - Specific Inquiry" ||
      self.requestorType() == "Employee - General Inquiry"
  })
  this.requestorFour = ko.observable();
  this.requestorBadgeNum = ko.observable();

  this.requestTopic = ko.observable();
  this.requestTopicOpts = ko.observableArray([
    "Allowances",
    "Taxes",
    "General",
  ]);

  this.requestQuestion = ko.observable();

  this.mail = {
    to: ko.pureComputed(function() {
      if (self.requestorIsEmployee()){
        return "payhelp@state.gov"
      } else if (self.requestorType()) {
        return "payintake@state.gov"
      } else {
        return '';
      }
    }),
    cc: ko.pureComputed(function () {
      return self.requestorEmail();
    }),
    subjectText: ko.pureComputed(function () {
      return `GFACS AME - New ${self.requestTopic()} Request - ${self.requestorName()}`;
    }),
    subject: ko.pureComputed(function() {
      return encodeURIComponent(self.mail.subjectText())
    }),
    bodyText: ko.pureComputed(function () {
      return `Requestor Name: \t${self.requestorName()}\n` +
          `Requestor Title: \t${self.requestorTitle()}\n` +
          `Requestor Office: \t${self.requestorOfficeSymbol()}\n` +
          `Requestor Telephone: \t${self.requestorTelephone()}\n` +
          `Requestor Email: \t${self.requestorEmail()}\n` +
          `Requestor Type: \t${self.requestorType()}\n` +
          `${self.requestorIsEmployeeSpecific() ? `SSN (last four): \t${self.requestorFour()}\n` : ''}` +
          `${self.requestorIsEmployeeSpecific() ? `Badge Num: \t${self.requestorBadgeNum()}\n` : ''}` +
          `Request Topic: \t${self.requestTopic()}\n\n` +
          `Request Question:\n${self.requestQuestion()}\n\n` + 
          `Please add any request attachments to this email before sending!`
    }),
    body: ko.pureComputed(function (){
      return encodeURIComponent(self.mail.bodyText());
    }),
    link: ko.pureComputed(function () {
      return (
        `mailto:${self.mail.to()}?cc=${self.mail.cc()}` +
        `&subject=${self.mail.subject()}&body=${self.mail.body()}`
      );
    }),
    linkOWA: ko.pureComputed(function () {
      return (
        `https://outlook.office.com/mail/deeplink/compose?` +
        `to=${self.mail.to()}&cc=${self.mail.cc()}` +
        `&subject=${self.mail.subject()}&body=${self.mail.body()}`
      );
    }),
  };


  this.requestAccess = ko.observable();
  this.requestAccessOpts = ko.observableArray([
    'OpenNet/GO Virtual/EMD',
    'GO Browser'
  ]);

  this.validate = ko.pureComputed(function () {
    if(!self.requestAccess()){
      alert('Access info is required')
      return false;
    }

    if(!self.requestorType()){
      alert('Contractor Type is required')
      return false;
    }
    
    if(self.requestorIsEmployeeSpecific()){
      let isSaveable = true;
      if(!self.requestorFour() && !self.requestorBadgeNum()) {
        alert('Last four of Social or Badge Number is Required')
        isSaveable = false;
      } else if (self.requestorFour() && self.requestorFour() > 9999) {
        alert('Please only provide last four digits of your social.')
        isSaveable = false;
      }

      return isSaveable
    }

    if(!self.requestTopic()) {
      alert('Topic is required')
      return false;
    }
    
    if(!self.requestQuestion()){
      alert('Question is required')
      return false;
    }
    return true;
  })

  this.submitToOWA = function () {
    if(self.validate()){
      primer = window.open('https://outlook.office.com/mail/deeplink/compose?', 'mailto')
      window.setTimeout(function(){
        // primer.close()
        primer = window.open(self.mail.linkOWA(), 'mailto');
        self.requestConfirm();
        }, 1500)
    }
  };

  this.submitToDesktop = function () {
    if(self.validate()){
      window.open(self.mail.link());
      self.requestConfirm();
    }
  };

  this.requestConfirm = function () {
    if (
      window.confirm(
        "Your request should now open in Outlook. You must send the email to submit your request.\n Click OK to be rerouted to the home page."
      )
    ) {
      window.location.assign('https://usdos.sharepoint.com/sites/CGFS-GFS/Compensation/AMPAY/GFACSAME/')
      }
    }
}

function getUserProperties() {
  var requestHeaders = {
    Accept: "application/json;odata=verbose",
    "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
  };

  jQuery.ajax({
    url:
      _spPageContextInfo.webAbsoluteUrl +
      "/_api/SP.UserProfiles.PeopleManager/GetMyProperties",
    type: "GET",
    contentType: "application/json;odata=verbose",
    headers: requestHeaders,
    success: function (data) {
      let results = data.d.UserProfileProperties.results;

      vm.currentUserProfile(data.d);
      vm.requestorName(
        results.find(function (prop) {
          return prop.Key == "PreferredName";
        }).Value
      );
      vm.requestorTitle(
        results.find(function (prop) {
          return prop.Key == "Title";
        }).Value
      );
      vm.requestorOfficeSymbol(
        results.find(function (prop) {
          return prop.Key == "Department";
        }).Value
      );
      vm.requestorTelephone(
        results.find(function (prop) {
          return prop.Key == "WorkPhone";
        }).Value
      );
      vm.requestorEmail(
        results.find(function (prop) {
          return prop.Key == "WorkEmail";
        }).Value
      );
    },
    error: function (jqxr, errorCode, errorThrown) {
      console.error(jqxr.responseText);
    },
  });
}
