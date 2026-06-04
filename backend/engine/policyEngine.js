const fs = require('fs');
const path = require('path');

//Ucitavanje politika iz JSONa
function loadPolicies(){
    const filePath = path.join(__dirname, '../policies/policies.json');
    const data = fs. readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

//izracunavanje kontekstualnih atributa
function getContextAttributes(ipNetwork = 'external') {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  return {
    time_of_day: (hour >= 8 && hour < 17) ? 'working_hours' : 'off_hours',
    day_of_week: (day >= 1 && day <= 5) ? 'weekday' : 'weekend',
    ip_network: ipNetwork
  };
}


//provera 1 uslova politike
function evaluateCondition(conditionKey, conditionValue, user, resource, context){
    const parts = conditionKey.split('.');
    const group = parts[0];
    const attribute = parts[1];

    if (typeof conditionValue === 'string' && conditionValue.startsWith('{{')){
        const refAttribute = conditionValue.replace('{{resource.','').replace('}}','');
        conditionValue = resource[refAttribute];
    }

    if(group === 'user') return user[attribute] === conditionValue;
    if(group === 'resource') return resource[attribute] === conditionValue;
    if(group === 'context') return context[attribute] === conditionValue;

    return false;
}

  function evaluate(user, resource, ipNetwork = 'external') {
    const policies = loadPolicies();
    const context = getContextAttributes(ipNetwork);
  
    // Sortira po prioritetu (veći broj = viši prioritet)
    const sorted = [...policies].sort((a, b) => b.priority - a.priority);
  
    let finalDecision = 'deny';
  
    for (const policy of sorted) {
      const conditions = policy.conditions;
      const allMatch = Object.entries(conditions).every(([key, value]) =>
        evaluateCondition(key, value, user, resource, context)
      );
  
      if (allMatch) {
        // Deny - ako ijedna politika kaže deny, odbijam
        if (policy.effect === 'deny') {
          return {
            decision: 'deny',
            policy: policy.id,
            reason: policy.name,
            context
          };
        }
        finalDecision = 'permit';
      }
    }
  
    return {
      decision: finalDecision,
      context
    };
  }
  
  module.exports = { evaluate };