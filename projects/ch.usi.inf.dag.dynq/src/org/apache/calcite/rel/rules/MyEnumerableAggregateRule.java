/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to you under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.calcite.rel.rules;

import org.apache.calcite.adapter.enumerable.EnumerableAggregate;
import org.apache.calcite.adapter.enumerable.EnumerableConvention;
import org.apache.calcite.adapters.enumerable.MyEnumerableAggregate;
import org.apache.calcite.plan.Convention;
import org.apache.calcite.plan.RelTraitSet;
import org.apache.calcite.rel.InvalidRelException;
import org.apache.calcite.rel.RelNode;
import org.apache.calcite.rel.convert.ConverterRule;
import org.apache.calcite.rel.core.AggregateCall;
import org.apache.calcite.rel.logical.LogicalAggregate;

/**
 * Rule to convert a {@link LogicalAggregate}
 * to an {@link EnumerableAggregate}.
 */
public class MyEnumerableAggregateRule extends ConverterRule {

  public static final MyEnumerableAggregateRule INSTANCE = new MyEnumerableAggregateRule();

  MyEnumerableAggregateRule() {
    super(Config.INSTANCE.withConversion(
            LogicalAggregate.class,
            Convention.NONE,
            EnumerableConvention.INSTANCE,
            "MyEnumerableAggregateRule"));
  }

  public RelNode convert(RelNode rel) {
    final LogicalAggregate agg = (LogicalAggregate) rel;
    // TODO implements DISTINCT in aggregations!
    for (AggregateCall aggCall : agg.getAggCallList()) {
      if (aggCall.isDistinct()) {
        return null;
      }
    }
    final RelTraitSet traitSet = rel.getCluster()
        .traitSet().replace(EnumerableConvention.INSTANCE);
    try {
      return new MyEnumerableAggregate(
          rel.getCluster(),
          traitSet,
          convert(agg.getInput(), traitSet),
          agg.getGroupSet(),
          agg.getGroupSets(),
          agg.getAggCallList());
    } catch (InvalidRelException e) {
      return null;
    }
  }
}
