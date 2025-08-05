var reverseWords = function(s) {
    debugger
    let arr=[];
    s=s.split(' ')
    for(let i=0; i<s.length;i++){
        let m=s[i]
        let n=''
        for(let j=m.length-1; j>=0; j--){
            n+=m[j]
        }
        arr.push(n)
    }
    return arr.join(' ')
};
console.log(reverseWords('apple and orange'))